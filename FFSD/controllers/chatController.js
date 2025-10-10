const ChatRoom = require('../models/chatModel');
const { ArchitectHiring, DesignRequest, Customer, Worker } = require('../models');

/**
 * Utility function to check if the user is authorized for the chat room.
 * This is crucial for security to ensure only the assigned customer/worker can join.
 */
const authorizeChatAccess = async (roomId, userId, userRole) => {
    // Attempt to find the chat room
    const chatRoom = await ChatRoom.findOne({ roomId }).lean();

    if (!chatRoom) {
        return { authorized: false, message: 'Chat room not found.' };
    }

    // Check if the current user is either the customer or the worker in this room
    const isCustomer = chatRoom.customerId.toString() === userId.toString() && userRole === 'customer';
    const isWorker = chatRoom.workerId.toString() === userId.toString() && userRole === 'worker';

    if (isCustomer || isWorker) {
        return { 
            authorized: true, 
            chatRoom, 
            isCustomer, 
            isWorker,
            // Determine the ID of the other user for fetching their name and status
            otherUserId: isCustomer ? chatRoom.workerId : chatRoom.customerId
        };
    }

    return { authorized: false, message: 'Unauthorized access to this chat room.' };
};

/**
 * Renders the chat page, fetching all required data.
 */
const getChatPage = async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = req.user.user_id;
        const userRole = req.user.role; // Assuming role is available in req.user

        if (!userId || !userRole) {
            return res.status(401).send('Unauthorized');
        }

        const { authorized, message, chatRoom, isCustomer, otherUserId } = await authorizeChatAccess(roomId, userId, userRole);

        if (!authorized) {
            return res.status(403).send(message);
        }

        // Fetch the other user's name for the chat header
        const OtherUserModel = isCustomer ? Worker : Customer;
        const otherUser = await OtherUserModel.findById(otherUserId).select('name').lean();
        
        // Fetch current user's name
        const CurrentUserModel = isCustomer ? Customer : Worker;
        const currentUser = await CurrentUserModel.findById(userId).select('name').lean();


        // Prepare initial data for the EJS template
        const chatData = {
            roomId: chatRoom.roomId,
            userId: userId.toString(),
            userName: currentUser ? currentUser.name : 'You',
            userRole: userRole,
            otherUserName: otherUser ? otherUser.name : 'Other User',
            // Messages are already sorted by default since we only append to the array.
            messages: chatRoom.messages, 
            activePage: 'chat'
        };

        res.render('chat', chatData);

    } catch (error) {
        console.error('Error fetching chat page:', error);
        res.status(500).send('Server Error');
    }
};

/**
 * Finds or creates a chat room when an offer is accepted.
 * Returns the chat room object containing the unique roomId.
 */
const findOrCreateChatRoom = async (projectId, projectType) => {
    try {
        // Create a unique room ID based on the project ID and type
        const roomId = `room-${projectId}-${projectType}`;
        
        let project;
        if (projectType === 'architect') {
            project = await ArchitectHiring.findById(projectId).lean();
        } else if (projectType === 'interior') {
            project = await DesignRequest.findById(projectId).lean();
        }

        // Crucial validation: must be an existing project and must be accepted
        if (!project || (project.status.toLowerCase() !== 'accepted' && project.status !== 'Accepted')) {
            return null;
        }

        // Get the customer and worker IDs based on the project type schema structure
        const customerId = projectType === 'architect' ? project.customer : project.customerId;
        const workerId = projectType === 'architect' ? project.worker : project.workerId;

        // Find or create the chat room document
        let chatRoom = await ChatRoom.findOne({ roomId });
        
        if (!chatRoom) {
            chatRoom = new ChatRoom({
                roomId,
                customerId,
                workerId,
                projectId,
                projectType,
                messages: []
            });
            await chatRoom.save();
        }

        return chatRoom;

    } catch (error) {
        console.error('Error in findOrCreateChatRoom:', error);
        // Fail silently and return null if chat room creation fails
        return null; 
    }
};

module.exports = {
    getChatPage,
    findOrCreateChatRoom,
    authorizeChatAccess
};

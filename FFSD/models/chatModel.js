const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        // Sender can be a Customer or a Worker, based on role
        refPath: 'senderModel' 
    },
    senderModel: {
        type: String,
        required: true,
        enum: ['Customer', 'Worker']
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const chatRoomSchema = new mongoose.Schema({
    // Unique ID for the chat room, e.g., 'room-60d0fe4f8b724c0015091d3d-architect'
    roomId: {
        type: String,
        required: true,
        unique: true
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    workerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Worker',
        required: true
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    projectType: {
        type: String,
        enum: ['architect', 'interior'],
        required: true
    },
    messages: [messageSchema]
}, { timestamps: true });

// FIX: Export the existing model if it's already defined, otherwise define it.
module.exports = mongoose.models.ChatRoom || mongoose.model('ChatRoom', chatRoomSchema);

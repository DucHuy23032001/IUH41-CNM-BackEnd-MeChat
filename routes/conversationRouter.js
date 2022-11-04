const Router = require("express").Router();
const ConversationsController = require("../controllers/conversationController");

Router.get("/:userId", ConversationsController.getAllConversationByUserID);
Router.post("/create-conversation", ConversationsController.createConversation);
Router.delete("/delete-conversation/:conversationId", ConversationsController.deleteConversation);
Router.delete("/delete-for-you/:conversationId",ConversationsController.deleteConversationForYou);
Router.post("/change-name/:conversationId", ConversationsController.changeName);

Router.post("/add-member-conversation/:conversationId", ConversationsController.addMemberConversation);
Router.post("/out-conversation/:conversationId", ConversationsController.outConversation);
Router.delete("/delete-member/:conversationId", ConversationsController.deleteMemberConversation);
module.exports = Router;
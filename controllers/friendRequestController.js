const FriendRequest = require("../models/friendRequest");
const User = require("../models/user");
const Conversation = require("../models/conversation");
const Message = require("../models/message");
const Account = require("../models/account");

//Oke
exports.addFriendRequestController = async (req, res) => {
  try {
    const { senderID, receiverID,content } = req.body;
    const _senderUser = await User.findById(senderID);
    if (senderID == receiverID) {
      return res
        .status(400)
        .json({ msg: "SenderID and ReciverID cannot be the same!" });
    }
    const _findFriendRequest = await FriendRequest.findOne({
      senderID: senderID,
      receiverID: receiverID,
    });
    if (_findFriendRequest) {
      return res.status(400).json({ msg: "FriendRequest already exist!" });
    }
    const _newFriendRequest = await FriendRequest.create({
      senderID: senderID,
      receiverID: receiverID,
      content:"Hello! I'm " + _senderUser.fullName + "!" + " Nice to meet you!"
    });
    const _account = await Account.findById(_senderUser.accountID);
    console.log(_account);
    const _data = {
      idFriendRequest: _newFriendRequest.id,
      senderId: senderID,
      phoneNumber:_account.phoneNumber,
      fullName: _senderUser.fullName,
      content: _newFriendRequest.content,
      imageLink: _senderUser.avatarLink,
    };
    // idFriendRequest: i.id,
    // senderId: _userSender.id,
    // phoneNumber:_userSender.phoneNumber,
    // fullName: _userSender.fullName,
    // content: i.content,
    // imageLink: _userSender.avatarLink,
    res.status(200).json({
      data: _data,
    });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};
//Oke
// Minhf guiwr cho nguoi ta
exports.getFriendRequestOfMe = async (req, res) => {
  try {
    let _datas = [];
    const _userID = req.params.userID;
    const _friendRequest = await FriendRequest.find({
      senderID: _userID,
    });

    const _senderUser = await User.findById(_userID);
    for (let i of _friendRequest) {
      let _userReceiver = await User.findById(i.receiverID);
      let _account = await Account.findById(_userReceiver.accountID)
      if (i.content == undefined) {
        i.content = "Hello! I'm " + _senderUser.fullName + "!" + " Nice to meet you!";
      }
      let _data = {
        idFriendRequest: i.id,
        receiverId: _userReceiver.id,
        phoneNumber:_account.phoneNumber,
        fullName: _userReceiver.fullName,
        content: i.content,
        imageLink: _userReceiver.avatarLink,
      };
      _datas.push(_data);
    }
    res.status(200).json({
      data: _datas,
    });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};
//Oke
// Ho gui den minh
exports.getListUserSendRequestAddFriendOfMe = async (req, res) => {
  try {
    let _datas = [];
    const _userID = req.params.userID;
    const _friendRequest = await FriendRequest.find({
      receiverID: _userID,
    });
    for (let i of _friendRequest) {
      let _userSender = await User.findById(i.senderID);
      let _account = await Account.findById(_userSender.accountID);
      if (i.content == undefined) {
        i.content =
          "Hello! I'm " + _userSender.fullName + "!" + " Nice to meet you!";
      }
      let _data = {
        idFriendRequest: i.id,
        senderId: _userSender.id,
        phoneNumber:_account.phoneNumber,
        fullName: _userSender.fullName,
        content: i.content,
        imageLink: _userSender.avatarLink,
      };
      _datas.push(_data);
    }
    res.status(200).json({
      data: _datas,
    });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};
//Oke
exports.friendRequest = async (req, res) => {
  const _status = req.body.status;
  const _friendRequestID = req.params.friendRequestID;
  const _senderID = req.body.senderID;
  const _receiverID = req.body.receiverID;
  const _friendRequest = await FriendRequest.findById(_friendRequestID);
  if (_friendRequest) {
    try {
      if (_status) {
        const _senderUser = await User.findById(_senderID);
        const _receiverUser = await User.findById(_receiverID);
        let _confirm = true;
        var _idConversation = "";

        const _findConversation = await Conversation.find({
          members: { $in: [_senderID] },
        });
        for (let i of _findConversation) {
          let _members = [];
          _members = i.members
          if(_members.length == 2){
            if(_members[0] == _receiverID || _members[1] == _receiverID){
              _confirm = false
              _idConversation = i.id
            }
          }
        }
        if (_confirm == false) {
          const _message = await Message.create({
            content: null,
            imageLink: null,
            conversationID: _idConversation,
            senderID: _receiverUser,
            action:"Hai bạn đã là bạn bè"
          });
          let _updateConversation = await Conversation.findByIdAndUpdate(
            { _id: _idConversation },
            {
              lastMessage: _message.id,
            },
            { new: true }
          );
        } 
        else {
          const _conversation = await Conversation.create({
            name: [_senderUser.fullName, _receiverUser.fullName],
            imageLink: [_senderUser.avatarLink, _receiverUser.avatarLink],
            members: [_senderUser, _receiverUser],
            createdBy: _receiverUser,
            deleteBy: null,
          });
          const _message = await Message.create({
            content: null,
            imageLink: null,
            conversationID: _conversation.id,
            senderID: _receiverUser,
            action:"Hai bạn đã là bạn bè"
          });
          let _updateConversation = await Conversation.findByIdAndUpdate(
            { _id: _conversation.id },
            {
              lastMessage: _message.id,
            },
            { new: true }
          );
        }

        //Xử lý thằng gửi
        let _friendsSenDer = _senderUser.friends;
        _friendsSenDer.push(_receiverUser);
        const _friendsSenDerUpdate = await User.findByIdAndUpdate(
          { _id: _senderUser.id },
          {
            friends: _friendsSenDer,
          },
          { new: true }
        );
        // Xử lý thằng nhận
        let _friendsReceiver = _receiverUser.friends;
        _friendsReceiver.push(_senderUser);
        const _friendsReceiverUpdate = await User.findByIdAndUpdate(
          { _id: _receiverUser.id },
          {
            friends: _friendsReceiver,
          },
          { new: true }
        );

        await FriendRequest.findByIdAndRemove(_friendRequestID);
        return res.status(200).json({
          message: "Accept friend request",
          friendRequestID:_friendRequestID,
          listFriendsReceiver: _friendsReceiverUpdate.friends,
          listFriendsSender: _friendsSenDerUpdate.friends,
          idSender:_senderID
        });
      } else {
        await FriendRequest.findByIdAndRemove(_friendRequestID);
        return res.status(200).json({
          message: "Don't accept friend request",
          friendRequestID:_friendRequestID,
          idSender:_senderID
        });
      }
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  } else {
    return res.status(200).json({
      status: 200,
      msg: "FriendRequest not exist ",
    });
  }
};

//Chưa test
exports.deleteFriendRequest = async (req, res) => {
  const _status = req.body.status;
  const _friendRequestID = req.params.friendRequestID;
  const _senderID = req.body.senderID;

  const _friendRequest = await FriendRequest.findById(_friendRequestID);
  if (_friendRequest) {
    try {
      if (_status) {
        if (_senderID == _friendRequest.senderID) {
          await FriendRequest.findByIdAndRemove(_friendRequestID);
          const _data = await FriendRequest.find({ senderID: _senderID });
          return res.status(200).json({
            message: "Delete friend request",
            data: _data,
          });
        } else {
          return res.status(200).json({
            message: "You don't",
          });
        }
      } else {
        return res.status(200).json({
          message: "Don't delete friend request",
        });
      }
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  } else {
    return res.status(200).json({
      status: 200,
      msg: "FriendRequest not exist ",
    });
  }
};
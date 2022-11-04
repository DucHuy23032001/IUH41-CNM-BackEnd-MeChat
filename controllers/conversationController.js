const AppError = require("../utils/appError");
const Conversation = require("../models/conversation");
const User = require("../models/user");
const Message = require("../models/message");

//Oke
exports.getAllConversationByUserID = async (req, res, next) => {
  try {
    let _datas = [];
    const _conversation = await Conversation.find({
      members: { $in: [req.params.userId] },
    });
    if (!_conversation) {
      return next(
        new AppError(404, "fail", "No document found with that id"),
        req,
        res,
        next
      );
    }
    for (let i of _conversation) {
      // console.log(i);
      let _names;
      let _name = "";
      let _imageLinks = i.imageLink;
      let _imageLink = "";
      let _members = [];
      let _data;
      const _user = await User.findById(req.params.userId);

      const _lastMessage = await Message.findOne({ conversationID: i })
        .sort({ createdAt: -1 })
        .limit(1);
        // console.log(_lastMessage);
      if (i.isGroup == false) {
        _names = i.name.pull(_user.fullName);
        _name += _names[0].trim();
        _imageLinks.pull(_user.avatarLink.trim());
        _imageLink = _imageLinks[0];
      } else if (i.isGroup) {
        _name = i.name[0];
        _imageLink = i.imageLink[0];
      }
      // console.log( "123" , _lastMessage.imageLink.length);
     if(_lastMessage.imageLink){
      if (_lastMessage.imageLink[_lastMessage.imageLink.length - 1] != null) {
        var _confirmEnd = _lastMessage.imageLink[_lastMessage.imageLink.length - 1].split(".");
        if (
          _confirmEnd[_confirmEnd.length - 1] == "jpg" ||
          _confirmEnd[_confirmEnd.length - 1] == "jpeg"
        ) {
          _lastMessage.content = "Hình ảnh";
        } else if (_confirmEnd[_confirmEnd.length - 1] == "mp4") {
          _lastMessage.content = "Video";
        }
      }
     }
      console.log(_lastMessage);
      _data = {
        id: i.id,
        name: _name,
        members: i.members,
        imageLinkOfConver: _imageLink,
        content: _lastMessage.content,
        imageLinkOfLastMessage: _lastMessage.imageLink[_lastMessage.imageLink.length - 1],
        fileLinkOfLastMessage: _lastMessage.fileLink,
        lastMessage: _lastMessage.action,
        time: _lastMessage.createdAt,
        isGroup: i.isGroup,
        isCalling: i.isCalling,
      };
      // console.log(_lastMessage.imageLink.length);
      _datas.push(_data);
      // console.log("last " , _datas);
    }
    console.log("last " , _datas);
    res.status(200).json({
      status: "success",
      data: _datas,
    });
  } catch (error) {
    next(error);
  }
};
//OKe
exports.createConversation = async (req, res, next) => {
  try {
    const { members, createdBy, name } = req.body;
    let _name = [];
    _name.push(name);
    let _imageLink = [];
    const _userCreate = await User.findById(createdBy);
    _imageLink.push(
      "https://mechat.s3.ap-southeast-1.amazonaws.com/avatarGroup.png"
    );
    const _newConversation = await Conversation.create({
      name: _name,
      imageLink: _imageLink,
      members: members,
      createdBy: createdBy,
      isGroup: true,
    });
    const _message = await Message.create({
      content: null,
      conversationID: _newConversation.id,
      imageLink: null,
      senderID: _userCreate,
      action: _userCreate.fullName + " đã tạo nhóm",
    });
    const _updateConversation = await Conversation.findByIdAndUpdate(
      { _id: _newConversation.id },
      {
        lastMessage: _message,
      },
      { new: true }
    );

    res.status(200).json(_updateConversation);
  } catch (error) {
    res.status(500).json({ msg: error });
  }
};
//Chua test
// exports.getConversationWithFriend = async (req, res) => {
//   try {
//     const _conversation = await Conversation.find({
//       $and: [
//         { members: { $size: 2 } },
//         { members: { $all: [req.params.friendId, req.body.userId] } },
//       ],
//     });
//     res.status(200).json(_conversation[0]);
//   } catch (error) {
//     res.status(500).json({ msg: error });
//   }
// };

//OKe
exports.addMemberConversation = async (req, res) => {
  const { conversationId } = req.params;
  const _newMember = req.body.newMemberID;
  const _memberAdd = req.body.memberAddID;
  try {
    const _memberAddUser = await User.findById(_memberAdd);
    const _memberNewUser = await User.findById(_newMember);
    const _conversationNow = await Conversation.findById(conversationId);
    const _members = _conversationNow.members;
    let _confirm = true;
    for (let i of _members) {
      if (i == _newMember) {
        _confirm = false;
      }
    }

    if (_confirm) {
      const _message = await Message.create({
        content: null,
        imageLink: null,
        conversationID: conversationId,
        senderID: _memberAdd,
        action:
          _memberAddUser.fullName +
          " đã thêm " +
          _memberNewUser.fullName +
          " vào nhóm.",
      });
      const _conversation = await Conversation.findByIdAndUpdate(
        { _id: conversationId },
        {
          members: _members,
          lastMessage: _message,
        },
        { new: true }
      );
      res.status(200).json(_message);
    } else {
      res.status(500).json({ msg: "Thành viên đã tồn tại!" });
    }
  } catch (error) {
    res.status(500).json({ msg: error });
  }
};
//Oke
exports.deleteMemberConversation = async (req, res) => {
  try {
    let { conversationId } = req.params;
    let { memberId, mainId } = req.body;
    let _conversationNow = await Conversation.findById(conversationId);
    let _confirm1 = false;
    let _confirm2 = false;
    if (mainId == _conversationNow.createdBy) {
      _confirm1 = true;
    }
    if (mainId == memberId) {
      _confirm2 = true;
    }
    if (_confirm1 == true) {
      if (_confirm2 == false) {
        const _members = _conversationNow.members.pull(memberId);
        const _memberDelete = await User.findById(memberId);
        const _main = await User.findById(mainId);
        const _message = await Message.create({
          content: null,
          conversationID: _conversationNow,
          senderID: _main.id,
          action:
            _main.fullName +
            " đã xóa " +
            _memberDelete.fullName +
            " ra khỏi nhóm!",
        });
        const _conversation = await Conversation.findByIdAndUpdate(
          { _id: conversationId },
          {
            lastMessage: _message,
            members: _members,
          },
          { new: true }
        );
        res.status(200).json(_message);
      } else {
        return res.status(500).json({ msg: "Admin can delete admin" });
      }
    } else {
      return res.status(500).json({ msg: "Only admin can delete members" });
    }
  } catch (error) {
    return res.status(500).json({ errorMessage: error });
  }
};
//Oke (chua tao tin nhan)
exports.outConversation = async (req, res) => {
  try {
    const _conversationId = req.params.conversationId;
    let { userId } = req.body;
    let _conversationNow = await Conversation.findById(_conversationId);
    const _memberOut = await User.findById(userId);
    let _members = _conversationNow.members.pull(userId);
    let _newCreateBy;
    if (userId == _conversationNow.createdBy) {
      _newCreateBy = _members[0];
    }
    let _conversation = await Conversation.findByIdAndUpdate(
      { _id: _conversationId },
      {
        createdBy: _newCreateBy,
        members: _members,
      },
      { new: true }
    );
    const _message = await Message.create({
      content: null,
      conversationID: _conversationNow,
      senderID: _memberOut.id,
      action: _memberOut.fullName + " Đã thoát khỏi nhóm",
    });
    res.status(200).json({ conversation: _conversation });
  } catch (error) {
    return res.status(500).json({ errorMessage: error });
  }
};
//Oke (chua tao tin nhan)
exports.changeName = async (req, res) => {
  try {
    const _userId = req.body.userId;
    const _newNameBody = req.body.newName;
    let _conversationId = req.params.conversationId;

    const _conversation = await Conversation.findById(_conversationId);
    const _user = await User.findById(_userId);

    let _newName = _newNameBody;
    const _conversationAfter = await Conversation.findByIdAndUpdate(
      { _id: _conversationId },
      {
        name: _newName,
      },
      { new: true }
    );
    const _message = await Message.create({
      content: null,
      conversationID: _conversation,
      senderID: _user,
      action: _user.fullName + "đã thay đổi tên nhóm thành: " + _newName,
    });
    res.status(200).json(_conversationAfter);
  } catch (error) {
    res.status(500).json({ msg: error });
  }
};
//Oke
exports.deleteConversation = async (req, res) => {
  try {
    const _conversationId = req.params.conversationId;
    const _mainID = req.body.mainId;
    const _conversation = await Conversation.findById(_conversationId);
    let _confirm = true;
    if (_mainID == _conversation.createdBy) {
      _confirm = false;
    }
    if (_confirm == false) {
      await Conversation.findByIdAndDelete({ _id: _conversationId });
      res.status(200).json({ msg: "Delete group chat successfully" });
    } else {
      res.status(500).json({ msg: "Only admin can delete group" });
    }
  } catch (error) {
    res.status(500).json({ errorMessage: error });
  }
};
//Oke
exports.deleteConversationForYou = async (req, res, next) => {
  try {
    const _conversationId = req.params.conversationId;
    const _userId = req.body.userId;
    const _conversation = await Conversation.findById(_conversationId);
    let _deleteBy = _conversation.deleteBy;
    _deleteBy.push(_userId);
    let _allMessages = await Message.find({
      conversationID: _conversationId
    })
    for (let i = 0; i < _allMessages.length; i++) {
      let _deleteByMessage = [];
      _deleteByMessage = _allMessages[i].deleteBy;
      _deleteByMessage.push(_userId);
      await Message.findByIdAndUpdate(_allMessages[i].id, {
        deleteBy: _deleteByMessage
      })
    }
    await Conversation.findByIdAndUpdate(_conversationId, {
      deleteBy: _deleteBy,
    });
    let _data = { id: _conversationId };
    res.status(200).json(_data);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
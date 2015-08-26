var doc = document,
    qs  = doc.querySelector;

// -- Sulaco -------------------------------------------------------------------
var Sulaco;

Sulaco = {
    lineCache: {},
    playbackMode: true,

    coalesceMessages: function (lineNum) {
        var lineEl     = Sulaco.getLineEl(lineNum),
            prevLineEl = lineEl && Sulaco.getLineEl(lineEl.previousElementSibling),
            prevSender = Sulaco.getSenderNick(prevLineEl),
            sender     = Sulaco.getSenderNick(lineEl);

        if (!sender || !prevSender) {
            return;
        }

        if (sender === prevSender
                && Sulaco.getLineType(lineEl) === 'privmsg'
                && Sulaco.getLineType(prevLineEl) === 'privmsg') {

            lineEl.classList.add('coalesced');
            Sulaco.getSenderEl(lineEl).innerHTML = '';
        }
    },

    getLineEl: function (lineNum) {
        if (typeof lineNum === 'string') {
            return doc.getElementById('line' + lineNum);
        }

        if (lineNum && lineNum.classList
                && lineNum.classList.contains('line')) {
            return lineNum;
        }

        return null;
    },

    getLineType: function (line) {
        line = Sulaco.getLineEl(line);
        return line ? line.getAttribute('type') : null;
    },

    getMessage: function (line) {
        line = Sulaco.getLineEl(line);
        return line ? line.querySelector('.message').textContent.trim() : null;
    },

    getSenderEl: function (line) {
        line = Sulaco.getLineEl(line);
        return line ? line.querySelector('.sender') : null;
    },

    getSenderNick: function (line) {
        var senderEl = Sulaco.getSenderEl(line);
        return senderEl ? senderEl.getAttribute('nickname') : null;
    },

    handleBufferPlayback: function (lineNum) {
        var line = Sulaco.getLineEl(lineNum),
            message;

        if (Sulaco.getSenderNick(line) === '***') {
            message = Sulaco.getMessage(line);

            if (message === 'Buffer Playback...') {
                line.classList.add('znc-playback-start');
                Sulaco.playbackMode = true;
            } else if (message === 'Playback Complete.') {
                line.classList.add('znc-playback-end');
                Sulaco.playbackMode = false;
            }

            return;
        }

        if (Sulaco.playbackMode) {
            var match;

            line.classList.add('znc-playback');

            message = Sulaco.getMessage(line);
            match   = message.match(/^\[(\d\d:\d\d:\d\d)\] /);

            if (match) {
                var msgEl = line.querySelector('.message');

                line.querySelector('.time').textContent = match[1];
                msgEl.innerHTML = msgEl.innerHTML.replace(/^\s*\[\d\d:\d\d:\d\d\]/, '');
            }
        }
    },

    setDescriptiveClassNames: function (lineNum) {
      var line = Sulaco.getLineEl(lineNum);

      if (line.getAttribute('type') === 'debug' &&
          /Disconnect/.test(line.textContent))
        line.classList.add('disconnect');

      if (line.getAttribute('type') === 'mode')
        line.classList.add('mode');

      if (line.getAttribute('type') === 'topic')
        line.classList.add('topic');

      if (line.getAttribute('type') === 'website')
        line.classList.add('website');

      if (line.getAttribute('type') === 'join' &&
          /Dominus/i.test(line.textContent))
        line.classList.add('dominus-join');

      if (line.getAttribute('type') === 'quit' &&
          /Dominus/i.test(line.textContent))
        line.classList.add('dominus-quit');

      if (line.getAttribute('type') === 'nick' &&
          /Dominus/i.test(line.textContent))
        line.classList.add('dominus-nick');

      if (line.getAttribute('type') === 'quit' &&
          /query/i.test(line.textContent))
        line.classList.add('quit-query');

      if (line.getAttribute('type') === 'join' &&
          /query/i.test(line.textContent))
        line.classList.add('join-query');
	
    }
};

// -- Textual ------------------------------------------------------------------

// Defined in: "Textual.app -> Contents -> Resources -> JavaScript -> API -> core.js"

Textual.newMessagePostedToView = function (lineNum) {
    Sulaco.handleBufferPlayback(lineNum);
    Sulaco.coalesceMessages(lineNum);
    Sulaco.setDescriptiveClassNames(lineNum);
};

Textual.viewFinishedLoading = function () {
    Textual.fadeInLoadingScreen(1.00, 0.95);

    setTimeout(function () {
        Textual.scrollToBottomOfView();
    }, 300);
};

Textual.viewFinishedReload = function () {
    Textual.viewFinishedLoading();
};

/* When you join a channel, delete all the old disconnected messages */
Textual.handleEvent = function (event) {
  'use strict';
  var i, messages;

  if (event === 'channelJoined') {
    messages = document.querySelectorAll('div[command="-100"]');
    for (i = 0; i < messages.length; i++) {
      if (app.channelIsJoined() && (messages[i].getElementsByClassName('message')[0].textContent.search('Disconnect') !== -1)) {
        messages[i].parentNode.removeChild(messages[i]);
      }
    }
  }
};

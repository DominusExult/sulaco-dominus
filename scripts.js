var doc = document,
    qs  = doc.querySelector;

// -- Sulaco -------------------------------------------------------------------
var Sulaco;

Sulaco = {
    lineCache: {},
    playbackMode: true,

    coalesceMessages: function (lineNum, fromBuffer) {
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

    getLineEl: function (lineNum, fromBuffer) {
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

    handleBufferPlayback: function (lineNum, fromBuffer) {
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

    setDescriptiveClassNames: function (lineNum, fromBuffer) {
      var line = Sulaco.getLineEl(lineNum);

      if (line.getAttribute('type') === 'debug' &&
          /Disconnect/i.test(line.textContent))
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

      if (line.getAttribute('type') === 'part' &&
          /Dominus/i.test(line.textContent))
        line.classList.add('dominus-part');

      if (line.getAttribute('type') === 'nick' &&
          /Dominus/i.test(line.textContent))
        line.classList.add('dominus-nick');

      if (line.getAttribute('type') === 'quit' &&
          /query/i.test(line.textContent))
        line.classList.add('quit-query');

      if (line.getAttribute('type') === 'join' &&
          /query/i.test(line.textContent))
        line.classList.add('join-query');
	},

	fixTimeStampFormatting: function(lineNum) {
		var line = Sulaco.getLineEl(lineNum);
		var time = line.querySelector('.time');

		if (!time)
			return;

		var matches = time.textContent.match(/\[([^\]]+)\]/);
		if (matches && matches[1]) {
			var timeParts = matches[1].split(':');
			var date = new Date();
			date.setHours(timeParts[0]);
			date.setMinutes(timeParts[1]);
			var minutesString = date.getMinutes() < 10?
			'0' + date.getMinutes() : date.getMinutes();
			time.innerHTML = date.getHours() + ':' + minutesString;
		}
	}
};

// -- Textual ------------------------------------------------------------------

// Defined in: "Textual.app -> Contents -> Resources -> JavaScript -> API -> core.js"

Textual.messageAddedToView = function (lineNum, fromBuffer) {
    Sulaco.handleBufferPlayback(lineNum, fromBuffer);
    Sulaco.coalesceMessages(lineNum, fromBuffer);
    Sulaco.setDescriptiveClassNames(lineNum, fromBuffer);
	Sulaco.fixTimeStampFormatting(lineNum, fromBuffer);
};

Textual.viewFinishedLoading = function () {
  Textual.fadeOutLoadingScreen(1.00, 0.95);
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

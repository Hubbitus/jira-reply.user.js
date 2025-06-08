// ==UserScript==
// @name         JIRA reply script
// @namespace    http://tampermonkey.net/
// @version      2025-05-29
// @description  User script to make easy reply to issue in JIRA
// @author       Pavel Alexeev <Pahan@Hubbitus.info>
// @include      *jira*/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=greasyfork.org
// @grant        none
// @downloadURL  https://github.com/Hubbitus/jira-reply.user.js/raw/main/jira-reply.user.js
// @updateURL    https://github.com/Hubbitus/jira-reply.user.js/raw/main/jira-reply.user.js
// ==/UserScript==

(async function() {
	'use strict';

	console.log('Hello from hubbitus jira reply');

// May bee needed to import jQuery if run (debug) outside JIRA:
//	await import ('https://code.jquery.com/jquery-3.7.1.min.js');

	const popup = $('<div id="jira-reply-tooltip"><img src="https://cdn.statically.io/gh/Hubbitus/static/main/images/icons/reply-icon.32px.png" alt="Reply to"/>Reply</div>');
	$(document.head).append(`
		<style>
			#jira-reply-tooltip {
				display: none;
				width: max-content;
				position: absolute;
				top: 0;
				left: 0;
				background: #7b7878;
				color: white;
				font-weight: bold;
				padding: 5px;
				border-radius: 4px;
				font-size: 90%;
				cursor: pointer;
			}
			#jira-reply-tooltip img {
				width: 16px;
				height: 16px;
				margin-right: 5px;
				vertical-align: sub;
			}
		</style>
	`)
	popup.on('click', (event) => {handleReply(popup.replyingTo, popup.replyText)});
	$(document.body).append(popup);
	$(document.body).on('click', (event) => {popup.fadeOut(2000);}); // Hide popup on click outside

	/**
	* Handle selection end.
	* @link by https://stackoverflow.com/questions/49059855/how-should-selection-selectfinish-selectend-event-be-implemented/56286003#56286003
	**/
	let selectionDelay = null, selection = '';
	document.addEventListener('selectionchange', (event) => {
		const currentSelection = document.getSelection().toString();
		if (currentSelection != selection) {
			selection = currentSelection;
			if (selectionDelay) {
				window.clearTimeout(selectionDelay);
			}
			selectionDelay = window.setTimeout(() => {
				handleSelection(document.getSelection(), popup);
				selection = '';
				selectionDelay = null;
			}, 500);
		}
	});

	// Activate editor:
	$('#footer-comment-button').trigger('click');
})();

/**
* Function to handle document selection by mouse and draw reply popup just after it.
* @param {*} selection
* @param {*} popup
**/
function handleSelection(selection, popup){
	// console.info(`Selected text "${selection}"`);
	// console.info(`Selection object:`, selection);
	const range =
		typeof selection?.rangeCount === "number" && selection.rangeCount > 0
		? selection.getRangeAt(0)
		: null;
	if (range) {
		/* Debug draw rects:
		console.log('range:', range)
		console.log('range.getBoundingClientRect():', range.getBoundingClientRect())
		let p = range.getBoundingClientRect();
		$(document.body).append(`
			<div id="range"
			style="position: absolute; top: ${p.top}px; left: ${p.left}px; height: ${p.height}px; width: ${p.width}px; border: 1px solid green;"></div>
		`);
		console.log('range.getClientRects():', range.getClientRects());
		p = range.getClientRects()[0];
		$(document.body).append(`
			<div id="range-0"
			style="position: absolute; top: ${p.top}px; left: ${p.left}px; height: ${p.height}px; width: ${p.width}px; border: 1px solid magenta;">r0</div>
		`);
		p = range.getClientRects()[1];
		if (p) {
			$(document.body).append(`
				<div id="range-1"
				style="position: absolute; top: ${p.top}px; left: ${p.left}px; height: ${p.height}px; width: ${p.width}px; border: 1px solid magenta;">r1</div>
			`);
		}
		*/
		let rects = range.getClientRects()
		let pos = rects[rects.length - 1]; // last rect is selected text
		popup.replyingTo = selection.focusNode;
		popup.replyText = `${selection}`;
		popup.css("left", `${window.scrollX + pos.left + pos.width}px`);
		popup.css("top", `${window.scrollY + pos.top - 25}px`);
		popup.css("display", 'block');
	}
}

function handleReply(replyNode, replyText){
	console.log('replyNode:', replyNode);
	console.log('replyNode.parentElement:', replyNode.parentElement);
	let comment = $(replyNode.parentElement).closest('.activity-comment')
	let userName = comment.find('.action-details .user-hover').attr('rel');
	let commentLink = comment.find('.action-details a[class*=commentdate]').attr('href');
	let replyCommentDate = comment.find('.action-details span.user-tz').attr('title');

	console.log('textarea text:', $('textarea#comment').text());

	$('textarea#comment').val(($('textarea#comment').val() + `
[~${userName}], в ответ на [комментарий|/${commentLink}] от ${replyCommentDate}:
{quote}${replyText}{quote}
`).trimStart()
	);
}

// ==UserScript==
// @name         Open Links in Modal
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  Open all links in a modal window after all AJAX requests have finished and specific elements are created
// @author       Your Name
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let activeAjaxRequests = 0;

    // Override XMLHttpRequest to keep track of active requests
    (function(open, send) {
        XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
            this.addEventListener('readystatechange', function() {
                if (this.readyState == 1) {
                    activeAjaxRequests++;
                } else if (this.readyState == 4) {
                    activeAjaxRequests--;
                }
            }, false);
            open.call(this, method, url, async, user, password);
        };
        XMLHttpRequest.prototype.send = function(data) {
            send.call(this, data);
        };
    })(XMLHttpRequest.prototype.open, XMLHttpRequest.prototype.send);

    function waitForAjaxRequests(callback) {
        const checkAjaxInterval = setInterval(() => {
            if (activeAjaxRequests === 0) {
                clearInterval(checkAjaxInterval);
                callback();
            }
        }, 100);
    }

    function createModal() {
        const body = document.body;

        const modal = document.createElement('div');
        modal.id = 'myModal';
        modal.style.display = 'none';
        modal.style.position = 'fixed';
        modal.style.zIndex = '1';
        modal.style.left = '0';
        modal.style.top = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.overflow = 'auto';
        modal.style.backgroundColor = 'rgb(0,0,0)';
        modal.style.backgroundColor = 'rgba(0,0,0,0.4)';

        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        modalContent.style.backgroundColor = '#fefefe';
        modalContent.style.margin = '2% auto';
        modalContent.style.padding = '20px';
        modalContent.style.border = '1px solid #888';
        modalContent.style.width = '96%';
        modalContent.style.height = '96%';

        const closeBtn = document.createElement('span');
        closeBtn.className = 'close';
        closeBtn.style.color = '#aaa';
        closeBtn.style.float = 'right';
        closeBtn.style.fontSize = '28px';
        closeBtn.style.fontWeight = 'bold';
        closeBtn.innerHTML = '&times;';
        closeBtn.onclick = function() {
            modal.style.display = 'none';
        };

        const iframe = document.createElement('iframe');
        iframe.id = 'modalIframe';
        iframe.style.width = '100%';
        iframe.style.height = 'calc(100% - 40px)'; // Adjust height for padding and border

        modalContent.appendChild(closeBtn);
        modalContent.appendChild(iframe);
        modal.appendChild(modalContent);
        body.appendChild(modal);

        window.onclick = function(event) {
            if (event.target == modal) {
                modal.style.display = 'none';
            }
        };

        return modal;
    }

    function addLinkListeners(modal) {
        const links = document.querySelectorAll('a');
        const iframe = document.getElementById('modalIframe');

        links.forEach(link => {
            link.addEventListener('click', function(event) {
                event.preventDefault();
                iframe.src = this.href;
                modal.style.display = 'block';
            });
        });
    }

    function waitForElementCreation(elementSelector, callback) {
        const observer = new MutationObserver((mutationsList, observer) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    const elements = document.querySelectorAll(elementSelector);
                    if (elements.length > 0) {
                        observer.disconnect();
                        callback();
                    }
                }
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    waitForAjaxRequests(() => {
        waitForElementCreation('a', () => {
            const modal = createModal();
            addLinkListeners(modal);
        });
    });
})();

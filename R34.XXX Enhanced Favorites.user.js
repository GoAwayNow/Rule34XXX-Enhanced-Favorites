// ==UserScript==
// @name         Rule34.XXX Enhanced Favorites
// @namespace    https://linktr.ee/GanbatGAN
// @version      20230712225950
// @description  Improves the favorites system on Rule34.XXX.
// @author       Ganbat
// @match        https://rule34.xxx/index.php?page=post&s=list&tags=*
// @match        https://rule34.xxx/index.php?page=favorites&s=view&id=*
// @match        https://rule34.xxx/index.php?page=post&s=view&id=*
// @icon         data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAElBMVEX///8AAAAzZjP///8AMwD/goPkod9bAAAAAXRSTlMBN+Ho8AAAAGpJREFUCNcdzMENAzEIBEAUpYF1yD8GN4BoIHfCBfBw/60cNnxGsEAvOfUjcWsi1kjxgWihb9hGUygKO1MNklq5ux0ANdHKSC90N4icc9RDSGUw4m5BI3N+OZPGyrl4FSZHxmR6XxEc1/8BoTATFUoWn+YAAAAASUVORK5CYII=
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @require      http://ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min.js
// @require      https://rule34.xxx/script/application.js
// @license      Unlicense
// ==/UserScript==

/* globals jQuery */

// Todo:
// Maybe totally reimplement the addFav function so I can monitor it.
// Maybe replace jquery with a pure js version.
// Refresh the favs list before modifying it in case the user has changed favorites in another tab.

// This function adapted from this gist: https://gist.github.com/GitHub30/59e002a5f57a4df0decbd7ac23290f77
function requestPromise ( url, method ) {
    return new Promise( function ( resolve ) {
        GM_xmlhttpRequest ( {
            method,
            url,
            onload: resolve
        } );
    } );
}

// Tests for installation and options of Image Board Enahancer.
// Returns zero if IBE not installed
// Returns 1 if #ibenhancer exists
// Returns 2 if #thumbPlusPreviewContainer exists (only on search pages)
// Returns 3 if #ibenhancer-post-controls exists (only on post pages)
function CheckIBE(timeout) {
    return new Promise(function (resolve) {
        setTimeout(function () {
            if (document.getElementById('ibenhancer-post-controls')) {
                resolve(3);
            } else if (document.getElementById('thumbPlusPreviewContainer')) {
                resolve(2);
            } else if (document.getElementById('ibenhancer')) {
                resolve(1);
            } else {
                resolve(0);
            }
        }, timeout);
    });
}

(async () => {
    'use strict';
    var $ = window.jQuery;

    let userID;
    if (document.cookie.search('user_id=') > -1) {
        userID = document.cookie.split('user_id=')[1].split(';')[0];
    }
    const loggedIn = Boolean(document.cookie.search('pass_hash=') > -1);
    const page = document.location.search.split('page=')[1].split('&')[0];
    const pageS = document.location.search.split('s=')[1].split('&')[0];
    let favsArray = await GM_getValue ( 'favs', [] );
    let verboseOutput = await GM_getValue ( 'verboseOutput', false );
    let noticeTimer
    const noticeNode = document.getElementById("notice");


    // Return true if favorite id is in favorites array
    function isFav ( id ) {
        return favsArray.indexOf ( id ) > -1;
    }

    // Add favorite id to favorites array
    function addFavList ( id ) {
        if ( !isFav ( id ) ) {
            favsArray.push ( id );
            GM_setValue ( 'favs', favsArray );
            if ( verboseOutput ) console.log ( 'Added favorite: ' + id );
        }
    }

    // Remove favorite id from favorites array
    function remFavList ( id ) {
        if ( isFav ( id ) ) {
            favsArray.splice ( favsArray.indexOf ( id ), 1 );
            GM_setValue ( 'favs', favsArray );
            if ( verboseOutput ) console.log ( 'Removed favorite: ' + id );
        }
    }

    // Remove favorite from site
    async function remFav(id){
        const result = await requestPromise('https://rule34.xxx/index.php?page=favorites&s=delete&id=' + id, 'HEAD');
         if (verboseOutput) { console.log('Status: ' + result.status); }
        switch (result.status) {
            case 200:
                if (verboseOutput) {
                    console.log('Removed site favorite: ' + id);
                }
                remFavList(id);
                notice("Post removed from favorites");
                hideNotice();
                break;
            case 403:
                alert(`403 Forbidden recieved when attempting to remove favorite.\r\n
                    If you see this message, please contact me immediately.\r\n
                    My contact information can be found on my Linktree, which is the homepage of this script.`);
                break;
            case 408:
                alert(`Request timed out.\r\nPlease try again.`);
                break;
            default:
                alert(`Error status code ${result.status}\r\nTry again later.`);
        }
        if (verboseOutput) console.log(result);
        return result;
    }

    function tpButton(){
        const tpPreviewCont = document.getElementById('thumbPlusPreviewContainer');
        const tpDetails = document.getElementById('thumbPlusDetailsOptions');
        let postID;

        const tpFavButton = document.createElement("div");
        tpFavButton.setAttribute('class', 'thumbPlusDetailsButton');
        tpFavButton.setAttribute('tooltip', 'Add to Favorites');
        tpFavButton.setAttribute('style', 'display: none;');
        tpFavButton.innerHTML = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="m22.052 3.5701c-1.2369-1.3415-2.9341-2.0804-4.7793-2.0804-1.3793 0-2.6424 0.43606-3.7544 1.296-0.56111 0.43405-1.0695 0.96509-1.5178 1.5849-0.44809-0.61963-0.9567-1.1509-1.518-1.5849-1.1118-0.8599-2.375-1.296-3.7543-1.296-1.8452 0-3.5426 0.73886-4.7795 2.0804-1.2221 1.3259-1.8954 3.1372-1.8954 5.1005 0 2.0208 0.75308 3.8706 2.3699 5.8215 1.4464 1.7451 3.5251 3.5167 5.9324 5.5681 0.82198 0.70057 1.7537 1.4947 2.7212 2.3405 0.25558 0.22386 0.58354 0.3471 0.92371 0.3471 0.33999 0 0.66812-0.12323 0.92334-0.34673 0.96746-0.84605 1.8997-1.6405 2.7221-2.3414 2.4069-2.051 4.4856-3.8224 5.932-5.5678 1.6168-1.9508 2.3697-3.8006 2.3697-5.8215 0-1.9632-0.67323-3.7745-1.8955-5.1003z"/></svg>'
        tpDetails.firstElementChild.appendChild(tpFavButton);
        tpFavButton.addEventListener('click', function(){
            addFavList(postID);
            post_vote(postID, 'up');
            addFav(postID);
            hideNotice();
            tpFavButton.setAttribute('style', 'display: none;');
            setTimeout(() => {
                tpPreviewCont.style.boxShadow = '0px 0px 5px 2px gold';
                tpRemButton.setAttribute('class', 'thumbPlusDetailsButton show');
            }, 300);
        });

        const tpRemButton = document.getElementById('thumbPlusDetailsButtonRemove')
        tpRemButton.addEventListener('click', async () => {
            tpRemButton.setAttribute('class', 'thumbPlusDetailsButton');
            const remFavResult = await remFav(postID);
            switch (remFavResult.status) {
                case 200:
                    tpFavButton.setAttribute('style', 'display: inline-block;');
                    tpPreviewCont.style.boxShadow = 'none';
                    break;
                case 403:
                    break;
                default:
                    tpRemButton.setAttribute('class', 'thumbPlusDetailsButton show');
            }
        });

        const thumbNode = document.getElementById('thumbPlusPreviewLink');
        const thumbObConfig = { attributeFilter: [ 'href' ] };

        const thumbCallback = function(mutationsList, observer) {
            postID = String(thumbNode.getAttribute('href')).replace(/\/?index\.php.+id=/, '');
            if (isFav(postID)) {
                tpFavButton.setAttribute('style', 'display: none;');
                tpRemButton.setAttribute('class', 'thumbPlusDetailsButton show');
                tpPreviewCont.style.boxShadow = '0px 0px 5px 2px gold';
            } else {
                tpFavButton.setAttribute('style', 'display: inline-block;');
                tpRemButton.setAttribute('class', 'thumbPlusDetailsButton');
                tpPreviewCont.style.boxShadow = 'none';
            }
        }

        const thumbObserver = new MutationObserver(thumbCallback);
        thumbObserver.observe(thumbNode, thumbObConfig);
    }

    function textButton() {
        GM_addStyle ( `
            .galFavBtn {
                cursor: pointer;
                color: #009;
            }
            .galFavBtn:hover {
                color: #000;
            }
        ` );
        $('.thumb').each(function () {
            let postLink = $(this).children('a').first();
            let postID = postLink.attr('id').substring(1);

            let textFavBtn = document.createElement('b');
            textFavBtn.setAttribute('class', 'galFavBtn');
            textFavBtn.setAttribute("style", "display: none;");
            textFavBtn.innerHTML = 'Add to Favorites';
            textFavBtn.addEventListener('click', function(){
                addFavList(postID);
                post_vote(postID, 'up');
                addFav(postID);
                hideNotice();
                textFavBtn.setAttribute("style", "display: none;");
                setTimeout(() => {
                    textRemBtn.setAttribute("style", "display: inline-block;");
                }, 300);
            });

            let textRemBtn = document.createElement('b');
            textRemBtn.setAttribute('class', 'galFavBtn');
            textRemBtn.setAttribute("style", "display: none;");
            textRemBtn.innerHTML = 'Remove Favorite';
            textRemBtn.addEventListener('click', async () => {
                textRemBtn.setAttribute("style", "display: none;");
                const remFavResult = await remFav(postID);
                switch (remFavResult.status) {
                    case 200:
                        textFavBtn.setAttribute("style", "display: inline-block;");
                        break;
                    case 403:
                        break;
                    default:
                        textRemBtn.setAttribute("style", "display: inline-block;");
                }
            });

            $(this).append('<br />', '<div>');
            $(this).children('div').last().append(textRemBtn);
            $(this).children('div').last().append(textFavBtn);
            if (isFav(postID)) {
                textRemBtn.setAttribute("style", "display: inline-block;");
            } else {
                textFavBtn.setAttribute("style", "display: inline-block;");
            }
        });
    }

    async function initPostViewPage() {
        const postID = window.location.href.match(/id=(\d+)/)[1];
        const addFavLink = document.querySelector(`div.sidebar > div.link-list > ul > li > a[onclick*='addFav']`);
        if (verboseOutput) console.log(addFavLink);
        const remFavLink = document.createElement('a');
        const remFavLI = document.createElement('li');
        let IBEControls;
        if (await CheckIBE(100) === 3) {
            IBEControls = document.getElementById('ibenhancer-post-controls');
            document.getElementById('unfavorite-button').addEventListener('click', () => {
                remFavLink.click();
            });

            // The fav button added by IBE doesn't do the things added by this script,
            // so we need to do it manually.
            document.getElementById('favorite-button').addEventListener('click', () => {
                addFavList(postID);
                addFavLink.parentElement.style.display = 'none';
                IBEControls.setAttribute('class', 'show-like');
                setTimeout(() => {
                    remFavLI.style.display = 'inline-block';
                    IBEControls.setAttribute('class', 'show-like show-unfavorite');
                }, 300);
            });
        }

        addFavLink.addEventListener('click', function(){
            addFavList(postID);
            addFavLink.parentElement.style.display = 'none';
            if (IBEControls) { IBEControls.setAttribute('class', 'show-like'); }
            setTimeout(() => {
                remFavLI.style.display = 'inline-block';
                if (IBEControls) { IBEControls.setAttribute('class', 'show-like show-unfavorite'); }
            }, 300);
        });

        remFavLink.setAttribute('href', '#');
        remFavLink.setAttribute('onclick', 'return false;');
        remFavLink.innerHTML = 'Remove from favorites';
        remFavLink.addEventListener('click', async () => {
            remFavLI.style.display = 'none';
            if (IBEControls) { IBEControls.setAttribute('class', 'show-like'); }
            const remFavResult = await remFav(postID);
            switch (remFavResult.status) {
                case 200:
                    addFavLink.parentElement.style.display = 'inline-block';
                    if (IBEControls) { IBEControls.setAttribute('class', 'show-like show-favorite'); }
                    break;
                case 403:
                    break;
                default:
                    remFavLI.style.display = 'inline-block';
                    if (IBEControls) { IBEControls.setAttribute('class', 'show-like show-unfavorite'); }
            }
        });

        remFavLI.style.display = 'none';

        addFavLink.parentElement.parentElement.appendChild(remFavLI);
        remFavLI.appendChild(remFavLink);

        if (isFav(postID)) {
            if (verboseOutput) console.log(`${postID} is a favorite.`);
            addFavLink.parentElement.style.display = 'none';
            remFavLI.style.display = 'inline-block';
            if (IBEControls) {
                IBEControls.setAttribute('class', 'show-like show-unfavorite')
            }
        }
    }

    async function initPostsPage() {
        if (await CheckIBE(100) === 2) {
            tpButton();
        } else {
            textButton();
        }
    }

    function initFavoritesPage() {
        // Test if id path component matches userID
        if (location.href.split('id=')[1].split('&')[0] != userID || !loggedIn) {
            initPostsPage();
        } else {
            const thumbs = document.querySelectorAll(".thumb");
            var addedFavs = 0
            for (var i = 0; i < thumbs.length; i++) {
                let postID = thumbs[i].querySelector('a:first-of-type').getAttribute('id').substring(1);
                if ( !isFav ( postID ) ) {
                    addFavList(postID);
                    addedFavs++
                }
            }
            if (addedFavs > 0) {
                notice(`Added ${addedFavs} of ${thumbs.length} favorites`)
                hideNotice();
            }
        }
    }

    function hideNotice() {
        clearTimeout(noticeTimer)
        noticeTimer = setTimeout(() => {
            noticeNode.style.display = 'none'
        }, 10000)
    }

    function initGlobal() {
        document.addEventListener("visibilitychange", async () => {
            if (!document.hidden) {
                if (verboseOutput) console.log('Refresh favsArray');
                favsArray = await GM_getValue ( 'favs', [] );
            }
        });
    }

    function initialize() {
        GM_addStyle ( `
            div#notice {
                position: fixed;
                background: #93c393;
                top: 0px;
                left: 0px;
                padding: 12px;
                z-index: 100;
            }
        ` );
        if (!loggedIn) {
            notice(`You are not currently logged in.`)
            hideNotice();
            return;
        }
        initGlobal();
        switch (page){
            case 'post':
                if (pageS == 'list') {
                    initPostsPage();
                } else if (pageS == 'view') {
                    initPostViewPage();
                }
                break;
            case 'favorites':
                initFavoritesPage();
                break;
            default:
                return;
        }
    }

    initialize();
})();

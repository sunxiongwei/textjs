/*!
 * text.JS v0.2
 * https://github.com/mklemarczyk/textjs
 *
 * Copyright (c) 2013-2014 Maciej Klemarczyk
 * Released under the MIT license
 */

function linifySinglePage(dataNode, store) {
	var lS;
	if (store != undefined) {
		lS = store;
	} else {
		lS = initLinifyStore(dataNode);
	}

	var po = 0;
	while (lS.currentNode != lS.dataNode || lS.dataNode.getAttribute("data-if") != "1") {
		goUp(lS);

		goDown(lS);

		if (lS.newContainer) {
			if (lS.currentContainer != lS.mainContainer) {
				closeLine(lS);
				if (lS.pageOn > 0) {
					$(".page-" + linifyStore.pageOn).remove();
					return;
				}
			}
			initializeLine(lS);
			lS.newContainer = false;
		}

		prepareLine(lS);

		var i;
		for (i = 0; i < lS.wordsArray.length; i++) {
			insertWord(lS, lS.wordsArray[i]);
			var currentLineHeight = getCurrentHeightOfContainer(lS);
			if (i == 0 && lS.currentLineHeight == 0) {
				lS.currentLineHeight = currentLineHeight;
			}
			if (currentLineHeight > lS.currentLineHeight * 1.3) {
				restoreInnerState(lS);
				closeLine(lS);
				if (lS.pageOn > 0) {
					$(".page-" + lS.pageOn).remove();
					return;
				}
				newLine(lS);
				insertWord(lS, lS.wordsArray[i]);
				saveCurrentHeightOfContainer(lS);
			}
		}
		if (po > 100000) return;
		else po++;
	}
	closeLine(lS);
}

function linify(dataNode, store) {
	var lS;
	if (store != undefined) {
		lS = store;
	} else {
		lS = initLinifyStore(dataNode);
	}

	var po = 0;
	while (lS.currentNode != lS.dataNode || lS.dataNode.getAttribute("data-if") != "1") {
		goUp(lS);

		goDown(lS);

		if (lS.newContainer) {
			if (lS.currentContainer != lS.mainContainer) {
				closeLine(lS);
			}
			initializeLine(lS);
			lS.newContainer = false;
		}

		prepareLine(lS);

		insertWords(lS);

		if (po > 100000) return;
		else po++;
	}
	closeLine(lS);
	saveStats(lS);
}

function initLinifyStore(dataNode, mainNode) {
	if (mainNode == undefined) {
		mainNode = dataNode.parentNode;
	}
	linifyStore = {
		"nodeTagsArray": new Array(),
		"openedTagsArray": new Array(),
		"attributesMapArray": new Array(),
		"wordsArray": new Array(),
		"lineOn": 0,
		"pageOn": 0,
		"lastContent": "",
		"currentLineHeight": 0,
		"currentPageHeight": 0,
		"currentContainerHeight": 0,
		"pageHeight": mainNode.clientHeight,
		"newContainer": true,
		"mainNode": mainNode,
		"dataNode": dataNode,
		"currentNode": null,
		"mainContainer": null,
		"currentContainer": null,
		"innerContainer": null
	};
	linifyStore.currentNode = linifyStore.dataNode;
	linifyStore.mainContainer = document.createElement("DIV");
	linifyStore.mainNode.appendChild(linifyStore.mainContainer);
	linifyStore.currentContainer = linifyStore.mainContainer;
	linifyStore.currentContainer.innerHTML = "&nbsp;";
	linifyStore.currentHeight = $(linifyStore.currentContainer).height();
	linifyStore.currentContainer.innerHTML = "";
	linifyStore.innerContainer = linifyStore.currentContainer;
	linifyStore.dataNode.classList.add("hidden");
	return linifyStore;
}

function getPcni(htmlElement) {
	var pcni = htmlElement.getAttribute("data-pcni");
	if (pcni == null) return 0;
	if (pcni == undefined) return 0;
	else return parseInt(pcni);
}

function goUp(lS) {
	while (lS.currentNode.nodeName == "#text" || lS.currentNode.getAttribute("data-if") == 1) {
		if (lS.currentNode.nodeName != "#text") {
			var tagName = lS.nodeTagsArray.pop();
			lS.openedTagsArray.pop();
			lS.attributesMapArray.pop();
			lS.innerContainer = lS.innerContainer.parentNode;
			if (tagName == "DIV" || tagName == "P") {
				lS.newContainer = true;
			}
		}
		lS.currentNode = lS.currentNode.parentNode;
	}
}

function goDown(lS) {
	while (lS.currentNode.nodeName != "#text" && getPcni(lS.currentNode) < lS.currentNode.childNodes.length) {
		var pcni = getPcni(lS.currentNode);

		lS.currentNode.setAttribute("data-pcni", pcni + 1);

		if (pcni + 1 == lS.currentNode.childNodes.length) {
			lS.currentNode.setAttribute("data-if", 1);
		}

		if (pcni == 0 && lS.currentNode != lS.dataNode && lS.currentNode != lS.mainNode) {
			lS.nodeTagsArray.push(lS.currentNode.tagName);
			lS.attributesMapArray.push(lS.currentNode.attributes);
		}
		lS.currentNode = lS.currentNode.childNodes[pcni];

		lS.wordsArray = getWordsArray(lS);

		if (lS.currentNode.nodeName != "#text") {
			var tagName = lS.currentNode.tagName;
			if (tagName == "BR") {
				lS.currentNode.setAttribute("data-if", 1);
				lS.newContainer = true;
				lS.currentNode = lS.currentNode.parentNode;
			}
			if (tagName == "HR") {
				lS.currentNode.setAttribute("data-if", 1);

			}
			if (tagName == "DIV" || tagName == "P" || tagName == "H1" || tagName == "H2" || tagName == "H3" || tagName == "H4" || tagName == "H5" || tagName == "H6") {
				lS.newContainer = true;
			}
		}
	}
}

function initializeLine(linifyStore) {
	linifyStore.currentContainer = linifyStore.innerContainer = document.createElement("DIV");
	linifyStore.innerContainer.classList.add("line");
	linifyStore.innerContainer.classList.add("line-" + linifyStore.lineOn);
	linifyStore.lineOn++;
	linifyStore.mainContainer.appendChild(linifyStore.currentContainer);
	linifyStore.openedTagsArray = new Array();
}

function prepareLine(linifyStore) {
	for (j = linifyStore.openedTagsArray.length; j < linifyStore.nodeTagsArray.length; j++) {
		var newInnerContainer = document.createElement(linifyStore.nodeTagsArray[j]);
		var k;
		for (k = 0; k < linifyStore.attributesMapArray[j].length; k++) {
			var attr = linifyStore.attributesMapArray[j][k];
			if (attr.name.substring(0, 4) != "data") {
				newInnerContainer.setAttribute(attr.name, attr.value);
			}
		}
		linifyStore.innerContainer.appendChild(newInnerContainer);
		linifyStore.innerContainer = newInnerContainer;
		linifyStore.openedTagsArray.push(linifyStore.nodeTagsArray[j]);
	}
}

function newLine(linifyStore) {
	initializeLine(linifyStore);
	prepareLine(linifyStore);
}

function closeLine(linifyStore) {
	var currentContainerHeight = linifyStore.currentContainer.clientHeight;
	if (currentContainerHeight === 0) {
		$(".line-" + (linifyStore.lineOn - 1)).remove();
		linifyStore.lineOn--;
	} else {
		linifyStore.currentContainerHeight = linifyStore.currentContainer.getBoundingClientRect().height;
		if (linifyStore.currentPageHeight + linifyStore.currentContainerHeight > linifyStore.pageHeight) {
			linifyStore.pageOn++;
			linifyStore.currentPageHeight = linifyStore.currentContainerHeight;
		} else {
			linifyStore.currentPageHeight += linifyStore.currentContainerHeight;
		}
		linifyStore.currentContainer.classList.add("page-" + linifyStore.pageOn);
	}
}

function insertWords(linifyStore) {
	var i;
	for (i = 0; i < linifyStore.wordsArray.length; i++) {
		insertWord(linifyStore, linifyStore.wordsArray[i]);
		var currentLineHeight = getCurrentHeightOfContainer(linifyStore);
		if (i == 0 && linifyStore.currentLineHeight == 0) {
			linifyStore.currentLineHeight = currentLineHeight;
		}
		if (currentLineHeight > linifyStore.currentLineHeight * 1.3) {
			restoreInnerState(linifyStore);
			closeLine(linifyStore);
			newLine(linifyStore);
			insertWord(linifyStore, linifyStore.wordsArray[i]);
			saveCurrentHeightOfContainer(linifyStore);
		}
	}
}

function saveInnerState(linifyStore) {
	linifyStore.lastContent = linifyStore.innerContainer.innerHTML;
	return linifyStore.lastContent;
}

function insertWord(linifyStore, word) {
	lastContent = saveInnerState(linifyStore);
	if (lastContent.length > 0) {
		linifyStore.innerContainer.innerHTML = lastContent + " " + word;
	} else {
		linifyStore.innerContainer.innerHTML = word;
	}
}

function restoreInnerState(linifyStore) {
	linifyStore.innerContainer.innerHTML = linifyStore.lastContent;
}

function getCurrentHeightOfContainer(linifyStore) {
	var currentLineHeight = linifyStore.currentContainer.offsetHeight;
	if (linifyStore.currentContainer.clientHeight !== 0) {
		currentLineHeight = linifyStore.currentContainer.getBoundingClientRect().height;
	}
	return currentLineHeight;
}

function saveCurrentHeightOfContainer(linifyStore) {
	linifyStore.currentLineHeight = getCurrentHeightOfContainer(linifyStore);
}

function breakLinify(linifyStore) {
	linifyStore.dataNode.setAttribute("data-if", 1);
	linifyStore.currentNode = linifyStore.dataNode;
}

function getWordsArray(lS) {
	var wordsArray = new Array();
	if (lS.currentNode.nodeName == "#text" && lS.currentNode.nodeValue.length > 0) {
		var nodeValueOriginal = lS.currentNode.nodeValue;
		var nodeValue = nodeValueOriginal.trim();
		if (nodeValue.length > 0) {
			wordsArray = nodeValue.split(" ");
			if (nodeValueOriginal.length > nodeValue.length) {
				if (nodeValueOriginal.substring(0, 1).search(/\s/) > -1) {
					wordsArray[0] = " " + wordsArray[0];
				}
				if (nodeValueOriginal.substring(nodeValueOriginal.length - 1).search(/\s/) > -1) {
					wordsArray.push(" ");
				}
			}
		} else {
			if (nodeValueOriginal.length > nodeValue.length) {
				wordsArray.push(" ");
			}
		}
	}
	return wordsArray;
}

function saveStats(linifyStore) {
	linifyStore.mainContainer.classList.add("linified");
	linifyStore.mainContainer.setAttribute("data-lines", linifyStore.lineOn + 1);
	linifyStore.mainContainer.setAttribute("data-pages", linifyStore.pageOn + 1);
}

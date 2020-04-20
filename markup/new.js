var create = document.createElement.bind(document);
var creator = function(tag) {
	return create.bind(document, tag);
};

var options = {
	append: function(parent, child) {
		parent.appendChild(child);
	},
	parent: function(child) {
		return child.parent;
	},

	// text node
	text: function(text) {
		return document.createTextNode(text);
	},
	lineBreak: creator('br'),
	
	root: creator('div'),
	// styling blocks
	bold: creator('b'),
	italic: creator('i'),
	underline: creator('u'),
	strikethrough: creator('s'),
	// heading
	heading: function(level) { // input: 1, 2, or 3
		return create('h'+level);
	},
	quote: function(user) {
		var node = create('blockquote');
		node.setAttribute('cite', user);
	},
};

function parse(code, options) {
	var output = options.root();
	var curr = output;
	
	// this is a list of all nodes that we are currently inside
	// as well as {}-block pseudo-nodes
	var stack = [{node:curr}];
	stack.top = function() {
		return stack[stack.length-1];
	};
	var textBuffer = "";
	var inside = {};
	var startOfLine = true;
	
	var i = -1;
	var c;
	scan();
	
	while (c) {
		if (c == "\n") {
			scan();
			endLine();
		//==========
		// \ escape
		} else if (c == "/") {
			scan();
			if (c == "\n")
				addBlock(options.lineBreak());
			else
				addText(c);
			scan();
		//===============
		// { group start (why did I call these "groups"?)
		} else if (c == "{") {
			scan();
			startBlock({type:'group'});
			skipLinebreak();
		//=============
		// } group end
		} else if (c == "}") {
			scan();
			if (stackContains('group')) {
				closeAll(false);
			} else {
				addText("}");
			}
		//========
		// * bold
		} else if (c == "*") {
			scan();
			doMarkup('bold', options.bold, "*");
		} else if (c == "/") {
			scan();
			doMarkup('italic', options.italic, "/");
		} else if (c == "_") {
			scan();
			doMarkup('underline', options.underline, "_");
		} else if (c == "~") {
			scan();
			doMarkup('strikethrough', options.strikethrough, "~");
		//=============
		// #... heading
		} else if (c == "#" && startOfLine && !stackContains('heading')) {
			var headingLevel = 1;
			scan();
			while (c == "#") {
				headingLevel++;
				scan();
			}
			if (headingLevel <= 3) {
				startBlock({
					type:'heading',
					node:options.heading(headingLevel)
				});
			} else { //invalid heading level
				addText('#'.repeat(headingLevel));
			}
		//============
		// >... quote
		} else if (c == ">" && startOfLine) {
			scan();
			start = i;
			while (c == " ")
				scan();
			while (c && !char_in(c, " \n{:"))
				scan();
			var name = code.substring(start, i).trim();
			if (c == ":")
				scan();
			while (c == " ")
				scan();
			startBlock({
				type: 'quote',
				node: options.quote(name)
			});
			skipLinebreak();
		//
		//=============
		// normal char
		} else {
			addText(c);
			scan();
		}
	}
	
	closeAll(true);
	return output;
	
	// ######################

	function skipLinebreak() {
		if (c == "\n")
			scan();
	}
	
	// closeAll(true) - called at end of document
	// closeAll(false) - called at end of {} block
	function closeAll(force) {
		while(stack.length) {
			if (!force && top_is("group")) {
				endBlock();
				return;
			}
			endBlock();
		}
	}
	
	function endLine() {
		var eat = false;
		while (1) {
			var top = stack.top();
			if (top.type == 'heading' || top.type == 'quote') {
				endBlock();
				eat = true;
			} else if (top.type == 'list') {
				// this will be very complicated
				
			} else {
				if (!eat)
					addBlock(options.lineBreak());
				break;
			}
		}
	}
	
	function doMarkup(type, create, symbol) {
		if (canStartMarkup(type)) {
			startBlock({type:type, node:create()});
		} else if (canEndMarkup(type)) {
			endBlock();
		} else {
			addText(symbol);
		}
	}
	// todo: maybe have support for non-ASCII punctuation/whitespace?
	function canStartMarkup(type) {
		return (
			(!code[i-2] || char_in(code[i-2], " \t\n({'\"")) && //prev char is one of these (or start of text)
			!char_in(c, " \t\n,'\"") && //next char is not one of these
			!stackContains(type)
		);
	}
	function canEndMarkup(type) {
		return (
			top_is(type) && //there is an item to close
			!char_in(code[i-2], " \t\n,'\"") && //prev char is not one of these
			(!c || char_in(c, " \t\n-.,:!?')}\"")) //next char is one of these (or end of text)
		);
	}
	function char_in(chr, list) {
		return chr && list.indexOf(chr) != -1;
	}
	
	function scan() {
		if (c == "\n" || !c)
			startOfLine = true;
		else if (c != " ")
			startOfLine = false;
		i++;
		c = code.charAt(i);
	}
	
	function stackContains(type) {
		for (var i=0; i<stack.length; i++) {
			if (stack[i].type == type) {
				return true;
			}
		}
		return false;
	}
	function top_is(type) {
		var top = stack.top();
		return top && top.type == type;
	}
	
	function startBlock(data) {
		stack.push(data);
		if (data.node) {
			flushText();
			options.append(curr, data.node);
			curr = data.node;
		}
	}
	// add simple block with no children
	function addBlock(node) {
		flushText();
		options.append(curr, node);
	}
	function addText(text) {
		if (text)
			textBuffer += text;
	}
	function flushText() {
		if (textBuffer) {
			options.append(curr, options.text(textBuffer));
			textBuffer = ""
		}
	}
	function endBlock() {
		flushText();
		stack.pop();
		var top = stack.top();
		if (!top) {
			curr = null;
		} else if (top.node) {
			curr = stack.top().node;
		}
	}
}


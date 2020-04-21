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
	line: creator('hr'),
	
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
		return node;
	},
	list: creator('ul'),
	// list item
	item: creator('li'),
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
		} else if (c == "\\") {
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
			var wasStartOf = startOfLine;
			scan();
			if (wasStartOf && (c==" " || c=="*") && !stackContains('heading')) {
				console.log("HEADING");
				var headingLevel = 1;
				while (c == "*") {
					headingLevel++;
					scan();
				}
				if (c == " " && headingLevel <= 3) {
					scan();
					startBlock({
						type:'heading',
						node:options.heading(headingLevel)
					});
				} else { //invalid heading level
					addText('*'.repeat(headingLevel));
				}
			} else {
				doMarkup('bold', options.bold, "*");
			}
		} else if (c == "/") {
			scan();
			doMarkup('italic', options.italic, "/");
		} else if (c == "_") {
			scan();
			doMarkup('underline', options.underline, "_");
		} else if (c == "~") {
			scan();
			doMarkup('strikethrough', options.strikethrough, "~");
		//============
		// >... quote
		} else if (c == ">" && startOfLine) {
			// todo: maybe >text should be a quote without author... 
			// need to add a way to add information to quotes:
			// - user ID
			// - post ID
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
		//==============
		// -... list/hr
		} else if (c == "-" && startOfLine) {
			scan();
			//----------
			// --... hr
			if (c == "-") {
				scan();
				var count = 2;
				while (c == "-") {
					count++;
					scan();
				}
				//-------------
				// ---<EOL> hr
				if (c == "\n" || !c) {
					skipLinebreak();
					addBlock(options.line);
				//----------
				// ---... normal text
				} else {
					addText("-".repeat(count));
				}
			//------------
			// - ... list
			} else if (c == " ") {
				scan();
				startBlock({
					type: 'list',
					level: 0,
					node: options.list()
				});
				startBlock({
					type: 'item',
					level: 0,
					node: options.item()
				});
			//---------------
			// - normal char
			} else {
				addText("-");
			}
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
			} else if (top.type == 'item') {
				// this.......
				eat = true;
				if (top.type == 'item')
					endBlock();
				var indent = 0;
				while (c == " ") {
					indent++;
					scan();
				}
				// OPTION 1:
				// no next item; end list
				console.log("what is C?",c);
				if (c != "-") {
					console.log ("ending list",stack.top());
					while (top_is('list')) {//should ALWAYS happen at least once
						endBlock();
						console.log(stack.top());
					}
					addText(" ".repeat(indent));
				} else {
					scan();
					while (c == " ")
						scan();
					// OPTION 2:
					// next item has same indent level; add item to list
					if (indent == top.level) {
						startBlock({
							type: "item",
							level: indent,
							node: options.item(),
						});
					// OPTION 3:
					// next item has larger indent; start nested list	
					} else if (indent > top.level) {
						startBlock({ // create a new list
							type: "list",
							node: options.list(),
						});
						startBlock({ // then made the first item of the new list
							type: "item",
							level: indent,
							node: options.item(),
						});
					// OPTION 4:
					// next item has less indent; try to exist 1 or more layers of nested lists
					// if this fails, fall back to just creating a new item in the current list
					} else {
						
					}
					break; //really?
				}
				// so basically with a list there are 4 options:
				// 1: (no next item) end of entire list
				// - item
				// <something else>
				// 2: (same indent) continuation of current list
				// - item
				// - item
				// 3: (increasing indent) sub-list
				// - item
				//  - item
				// 4: (decreasing indent) end of sub-list
				// - item
				//  - item
				// - item
				
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


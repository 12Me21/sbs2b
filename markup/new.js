var create = document.createElement;
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
	root: creator('div'),
	text: function(text) {
		return document.createTextNode(text);
	},
	bold: creator('b'),
	italic: creator('i'),
	underline: creator('u'),
	strikethrough: creator('s'),
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
	
	var i = -1;
	var c;
	scan();
	
	while (c) {
		//==========
		// \ escape
		if (c == "/") {
			scan();
			addText(c);
			scan();
		//===============
		// { group start (why did I call these "groups"?)
		} else if (c == "{") {
			scan();
			stack.push({type:'group'});
		//=============
		// } group end
		} else if (c == "}") {
			scan();
			if (stackContains('group')) {
				// close everything that was opened inside the group
				while (!top_is('group')) {
					endBlock();
				}
				endBlock();
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
		// normal char
		} else {
			addText(c);
			scan();
		}
	}
	
	flushText();
	return output;
	
	// ######################
	
	function doMarkup(type, create, symbol) {
		if (canStartMarkup(type)) {
			addBlock({type:type, node:create()});
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
	
	function addBlock(data) {
		stack.push(data);
		if (data.node) {
			flushText();
			options.append(curr, data.node);
			curr = data.node;
		}
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
		if (top.node) {
			curr = stack.top().node;
		}
	}
}

// ex:
// if char == * and (requirements) and !stackContains("bold") then
//  stack.push({type:"bold"});
//  addBlock(options.bold());
// if (bold end tag) and isOnTopOfStack("bold") then
//  stack.pop()
//




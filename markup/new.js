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
	
};

function parse(code, options) {
	var output = options.root();
	var curr = output;
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
		} else if (c == "*") {
			scan();
			if (top_is('bold')) {
				endBlock();
			} else if (!stackContains('bold')) {
				console.log("bold starting");
				addBlock({
					node: options.bold(),
					type: 'bold',
				});
			} else {
				addText('*');
			}
		} else {
			addText(c);
			scan();
		}
	}
	
	flushText();
	return output;
	
	// ######################

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
		console.log("[");
		flushText();
		stack.push(data);
		options.append(curr, data.node);
		curr = data.node;
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
		console.log("]");
		flushText();
		stack.pop();
		curr = stack.top().node;
	}
}

// ex:
// if char == * and (requirements) and !stackContains("bold") then
//  stack.push({type:"bold"});
//  addBlock(options.bold());
// if (bold end tag) and isOnTopOfStack("bold") then
//  stack.pop()
//




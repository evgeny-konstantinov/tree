// script's constants
var param = {
	rootNodeClass : 'root',
	nodeClass : 'node',
	openedClass : 'opened',
	closedClass : 'closed',
	selectedClass : 'selected',
	lastClass : 'last',
	expanderClass : 'expander',
	leafClass : 'leaf',
	nodeContentClass : 'node-content',
	nodeContainerClass : 'node-container',
	nodeSelectEvent : 'nodeselect',
	nodeCollpseEvent : 'nodecollapse',
	nodeExpandEvent : 'nodeexpand',

};

// Tree declaration. Implements EventTarget
function Tree(name) {
	var node = new TreeNode(name);
	node.owner = this;
	this.node = node;
	var element = node.element;
	element.classList.add(param.rootNodeClass);
	var rootWrapper = document.createElement('ul');
	rootWrapper.className = param.nodeContainerClass;
	rootWrapper.appendChild(element);

	// tree's html representation
	this.element = rootWrapper;
	this.eventListeners = {};
	this.selectedNode;
	this.containerElement;
};

Tree.prototype.addChild = function(treeNode) {
	this.node.addChild(treeNode);
};

Tree.prototype.addEventListener = function(type, listener) {
	var self = this;
	var wrapper = function(e) {
		/*
		 * e.target = e.srcElement; e.currentTarget = self;
		 */
		if (listener.handleEvent) {
			listener.handleEvent(e);
		} else {
			listener.call(self, e);
		}
	};
	if (!this.eventListeners[type]) {
		this.eventListeners[type] = [];
	}
	this.eventListeners[type].push({
		object : this,
		listener : listener,
		wrapper : wrapper
	});

};

Tree.prototype.removeEventListener = function(type, listener) {
	var counter = 0;
	var listeners = this.eventListeners[type];
	while (counter < listeners.length) {
		var eventListener = listeners[counter];
		if (eventListener.object == this && eventListener.listener == listener) {
			this.eventListeners[type].splice(counter, 1);
			break;
		}
		++counter;
	}

};

Tree.prototype.dispatchEvent = function(event) {
	var listeners = this.eventListeners[event.type];
	if (!listeners) {
		return;
	}
	for ( var i = 0; i < listeners.length; i++) {
		var listener = listeners[i];
		listener.wrapper(event);
	}
	return !event.defaultPrevented;
};

Tree.prototype.getSelectedNode = function() {
	return (this.selectedNode) ? this.selectedNode : null;
};

Tree.prototype.appendTo = function(element) {
	this.containerElement = element;
	element.appendChild(this.element);
};

Tree.prototype.remove = function() {
	this.containerElement.removeChild(this.element);
};

// TreeNode declaration
function TreeNode(name) {
	var that = this;
	this.label = name;
	// html representation of the node
	this.element = TreeNode.prototype.createNodeElement(name);
	this.element.getElementsByClassName(param.expanderClass)[0].addEventListener('click',
			function() {
				var expanded = that.element.classList.contains(param.closedClass);
				that.setExpanded(expanded);
			}, false);
	this.element.getElementsByClassName(param.nodeContentClass)[0].addEventListener('click',
			function() {
				if (that === that.owner.selectedNode) {
					that.owner.selectedNode = null;
					that.selected = false;
					this.classList.remove(param.selectedClass);
				} else {
					if (that.owner.selectedNode) {
						that.owner.selectedNode.element
								.getElementsByClassName(param.nodeContentClass)[0].classList
								.remove(param.selectedClass);
					}
					that.setSelected();
				}
			}, false);
};

TreeNode.prototype = {
	expanded : false,
	selected : false,
	nodeTemplate : '<li class="node leaf last"> \
		<div class="expander"></div> \
		<div class="node-content"></div> \
		<ul class="node-container"></ul> \
	</li>'
};

TreeNode.prototype.createNodeElement = function(name) {
	var container = document.createElement('div');
	var nodeName = document.createTextNode(name);
	container.innerHTML = this.nodeTemplate;
	container.getElementsByClassName(param.nodeContentClass)[0].appendChild(nodeName);
	return container.firstChild;
};

TreeNode.prototype.addChild = function(treeNode) {
	treeNode.parent = this;
	if (!treeNode.getOwnerTree()) {
		var parent = treeNode.getParent();
		var owner = parent.getOwnerTree();
		while (!owner) {
			parent = parent.getParent();
			owner = parent.getOwnerTree();
		}
		this.owner = owner;
		treeNode.owner = owner;
	}
	var thisContainer = this.element.getElementsByClassName(param.nodeContainerClass)[0];
	thisContainer.appendChild(treeNode.element);
	var thisChild = thisContainer.childNodes;
	var childCount = thisChild.length;
	if (childCount > 1) {
		thisChild[childCount - 2].classList.remove(param.lastClass);
	}
	thisChild[childCount - 1].classList.add(param.lastClass);
	this.element.classList.remove(param.leafClass);
	this.element.classList.add(param.closedClass);
};

TreeNode.prototype.setExpanded = function(expanded) {
	if (this.element.classList.contains(param.leafClass)) {
		return;
	}

	this.expanded = expanded;

	this.element.classList.toggle(param.closedClass);
	this.element.classList.toggle(param.openedClass);
	if (expanded && this.owner) {
		var nodeExpandEvent = new TreeEvent(this);
		nodeExpandEvent.initEvent(param.nodeExpandEvent, true, true);
		this.owner.dispatchEvent(nodeExpandEvent);
	} else {
		if (this.owner) {
			var nodeCollapseEvent = new TreeEvent(this);
			nodeCollapseEvent.initEvent(param.nodeCollpseEvent, true, true);
			this.owner.dispatchEvent(nodeCollapseEvent);
		}
	}
};

TreeNode.prototype.isExpanded = function() {
	return this.isExpanded;
};

TreeNode.prototype.setSelected = function() {
	this.owner.selectedNode = this;
	this.selected = true;
	this.element.getElementsByClassName(param.nodeContentClass)[0].classList
			.add(param.selectedClass);
	var nodeSelectEvent = new TreeEvent(this);
	nodeSelectEvent.initEvent(param.nodeSelectEvent, true, true);
	this.owner.dispatchEvent(nodeSelectEvent);

};

TreeNode.prototype.isSelected = function() {
	return this.selected;
};

TreeNode.prototype.setLabel = function(name) {
	var nodeName = document.createTextNode(name);
	this.label = name;
	this.element.getElementsByClassName(param.nodeContentClass)[0].appendChild(nodeName);
};

TreeNode.prototype.getLabel = function() {
	return this.element.getElementsByClassName(param.nodeContentClass)[0].innerHTML;
};

TreeNode.prototype.getParent = function() {
	return this.parent;
};

TreeNode.prototype.getOwnerTree = function() {
	return this.owner;
};
// TreeEvent declaration

/*function TreeEvent(type, relatedNode) {
	var event = document.createEvent('Event');
	event.initEvent(type, true, true);
	event.relatedNode = relatedNode;
	return event;
};*/

// TreeEvent declaration
function TreeEvent(relatedNode) {
	this.relatedNode = relatedNode;
};

// default values
TreeEvent.prototype = {
	NONE : 0,
	CAPTURING_PHASE : 1,
	AT_TARGET : 2,
	BUBBLING_PHASE : 3,
	type : "",
	target : null,
	currentTarget : null,
	eventPhase : 0,
	bubbles : false,
	cancelable : false,
	timestamp : new Date(0),
	defaultPrevented : false,
	isTrusted : false
};

TreeEvent.prototype.stopPropagation = function() {

};

TreeEvent.prototype.preventDefault = function() {

};

TreeEvent.prototype.stopImmediatePropagation = function() {

};

TreeEvent.prototype.initEvent = function(eventType, canBubbleArg, cancelableArg) {
	this.type = eventType;
	this.bubbles = canBubbleArg;
	this.cancelable = cancelableArg;
	this.timestamp = new Date();
};

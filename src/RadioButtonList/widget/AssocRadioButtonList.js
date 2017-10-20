/**
	Radio button list Widget
	========================

	@file      : RadioButtonList.js
	@version   : 2.0
	@author    : Roeland Salij
	@date      : 27-5-2010
	@copyright : Mendix
	@license   : Please contact our sales department.

	Documentation
	=============
	This widget can be used to show a radio button list instead of a dropdown list bases on an association.
	
	Open Issues
	===========
	
*/
define([
	"dojo/_base/declare",
	"mxui/widget/_WidgetBase",
	"dijit/_TemplatedMixin",
    'mxui/dom',
	"dojo/_base/lang",
	"dojo/dom-attr",
	"dojo/dom-style",
	"dojo/dom-class",
	"dojo/query",
	"dojo/dom-construct"
], function (declare, _WidgetBase, _TemplatedMixin, dom, lang, domAttr, domStyle, domClass, query, domConstruct) {
	"use strict";

	return declare("RadioButtonList.widget.AssocRadioButtonList", [ _WidgetBase, _TemplatedMixin ], {
	//DECLARATION
	templateString : '<div class="RadioButtonList"><ul dojoAttachPoint="listNode"></ul><div style="float:none;clear:both"></div></div>',
	inputargs: { 
		RadioListObject : '',
		Constraint : '',
		RadioListItemAttribute: '',
		name: '',
		direction : 'horizontal',
		onchangeAction : '',
		readonly : false,
		sortAttr : '',
		sortOrder : 'asc'
	},
	
	//IMPLEMENTATION
	mendixobject : null,
	nameName : '',
	attrDisable :false,
	selectedValue : null,
	keyNodeArray : null,
	
	// updates the widget with a new dataobject
	setDataobject : function(mxObject) {
		//this.name = mxObject.getClass() + "/" + this.assocName; //to catch data validation
		this.mendixobject = mxObject;
		logger.debug(this.id + ".setDataobject");
		var self = this;

		mx.data.subscribe({
		    guid     : mxObject.getGuid(),
		    val      : true,
		    callback : function(validations) {
		    	if(self.readonly){
		    		validations[0].removeAttribute(self.name);
		    	} else {
			    	var reason = validations[0].getReasonByAttribute(self.name);
					if(query('.alert', this.domNode).length > 0) {
						domConstruct.destroy(query('.alert', this.domNode)[0]);
					}
			        var div = dom.create('div', {'class' : 'alert alert-danger'});
			        mxui.dom.textContent(div, reason);
			        domConstruct.place(div, self.domNode, 'last');
			        validations[0].removeAttribute(self.name);
		    	}
		    }
		});

		this.getListObjects(this.mendixobject);
	},
	
	getListObjects : function(context) {
		var xpathString = '';
		if (context)
			xpathString = "//" + this.RadioListObject + this.Constraint.replace("'[%CurrentObject%]'", context);
		else
			xpathString = "//" + this.RadioListObject + this.Constraint;
		
		mx.data.get({
			xpath: xpathString,
			filter: {
				sort: [[this.sortAttr, this.sortOrder]],
				offset: 0,
				amount: 50
			},
			callback: lang.hitch(this, this.initRadioButtonList)
		});
	},
	
	initRadioButtonList : function(mxObjArr){
		domConstruct.empty(this.listNode);
		var mxObj;
		
		var currentSelectedValue;
		
		if(this.mendixobject.getReferences(this.assocName).length == 1) {
			this.selectedValue = currentSelectedValue = this.mendixobject.getReferences(this.assocName)[0];
		}
		
		for (var i = 0; i < mxObjArr.length; i++) {
			mxObj = mxObjArr[i];
			
			var radioid = this.RadioListObject+'_'+this.id+'_'+i;
								
			var labelNode = dom.create("label");
			domAttr.set(labelNode,'for', radioid);
			domAttr.set(labelNode, 'disabled', this.attrDisable);
			
			var guid = mxObj.getGuid();
			var rbNode = dom.create("input", {
				'type' : 'radio',
				'value' : guid ,
			//	'name' : "radio"+this.mendixobject.getGUID()+'_'+this.id,
				'id' : radioid
			});

			//MWE: name is set here, because otherwise it will result in a
			//"INVALID_CHARACTER_ERR (5)" exception,
			//which is a result of the fact that document.createElement("<tagname baldibla='basdf'>") is not allowed anymore
			domAttr.set(rbNode, 'name', "radio"+this.mendixobject.getGuid()+'_'+this.id);

			this.keyNodeArray[guid] = rbNode;
			
			domAttr.set(rbNode, 'disabled', this.attrDisable);
			
			if (currentSelectedValue == mxObj.getGuid()) {
				domAttr.set(rbNode,'defaultChecked', true);
			}
			
			var textDiv = dom.create("span", null, mxObj.get(this.RadioListItemAttribute));
			domStyle.set(textDiv, { cursor : 'default' });
			
			labelNode.appendChild(rbNode);
			labelNode.appendChild(textDiv);
			
			this.connect(rbNode, "onclick", lang.hitch(this, this.onclickRadio, mxObj.getGuid(), rbNode));
			this.connect(textDiv, "onclick", lang.hitch(this, this.onclickRadio, mxObj.getGuid(), rbNode));
			
			var listItemNode = dom.create("li", null, labelNode);
			
			if(this.direction == 'horizontal') {
				domClass.add(listItemNode, 'horizontal');
			}
			
			this.listNode.appendChild(listItemNode);
		}
			
	},
	
	onclickRadio : function( radioKey, rbNode) {
		logger.debug(this.id + ".onclickRadio");
		if (this.attrDisable)
			return;
			
		this._setValueAttr(radioKey);
		domAttr.set(rbNode,'checked', true);
			
		this.onChange();
		this.triggerMicroflow();
	},
		
	
	_getValueAttr : function () {
		return this.selectedValue;
	},
		
			
	_setValueAttr : function (value) {
		
		if ( this.selectedValue != null) {
			if (  this.selectedValue != '' && this.keyNodeArray[this.selectedValue] ) {
				this.keyNodeArray[this.selectedValue].checked = false;
				this.keyNodeArray[this.selectedValue].defaultChecked = false;
			}
		}
		this.selectedValue = value;

		if (this.mendixobject != null) {
			this.mendixobject.set(this.assocName, value);
		}
		if (value !== '' && this.keyNodeArray[value]) {
			this.keyNodeArray[this.selectedValue].checked = true;
			this.keyNodeArray[this.selectedValue].defaultChecked = true;
		}
	},
		
	//invokes the microflow coupled to the tag editor
	triggerMicroflow : function() {
		logger.debug(this.id + ".triggerMicroflow");
		
		if (this.onchangeAction)
		{
			mx.data.action({
				params: {
					actionname  : this.onchangeAction,
					applyto     : 'selection',
					guids       : [this.mendixobject.getGuid()]
				},
				error       : function() {
					logger.error("RadioButtonList.widget.AssocRadioButtonList.triggerMicroFlow: XAS error executing microflow");
				}
			});
		}
	},

	_setDisabledAttr : function (value) {
		if (!this.readonly)
			this.attrDisable = !!value;
	},
	
	//summary : stub function, will be used or replaced by the client environment
	onChange : function(){
	},

	postCreate : function(){
		logger.debug(this.id + ".postCreate");
		this.keyNodeArray = {};
		this.assocName = this.name.split("/")[0];
		
		this.name = this.assocName; //to catch data validation
		//dojo.attr(this.domNode, 'name', this.name);
		
		if (this.readonly)
			this.attrDisable = true;
	
		// this.initContext();
		// this.actRendered();
	},
	
	applyContext : function(context, callback){
		logger.debug(this.id + ".applyContext");
		
		if (context)
			mx.data.get({
				guid: context.getTrackId(),
				callback: lang.hitch(this, this.setDataobject)
			});
		else
			logger.warn(this.id + ".applyContext received empty context");
			
		callback && callback();
	},
	
	uninitialize : function(){
		logger.debug(this.id + ".uninitialize");
	}
		});
	});

require([ "RadioButtonList/widget/AssocRadioButtonList" ]);

/**
	Radiobutton List Widget
	========================

	@file      : RadioButtonList.js
	@version   : 2.0 
	@author    : Roeland Salij
	@date      : 27-5-2010
	@copyright : Mendix
	@license   : Please contact our sales department.

	Documentation
	=============
	This widget can be used to show a radio button list instead of a dropdown list based on an enumeration attribute of an object.
	
	Open Issues
	===========


	
*/
define([
	"dojo/_base/declare",
	"mxui/widget/_WidgetBase",
	"dijit/_TemplatedMixin",
	"dojo/_base/lang",
    'mxui/dom',
	"dojo/dom-attr",
	"dojo/query",
	"dojo/dom-construct",
	"dojo/dom-style"
], function (declare, _WidgetBase, _TemplatedMixin, lang, dom, domAttr, query, domConstruct, domStyle) {
	"use strict";

	return declare("RadioButtonList.widget.AttrRadioButtonList", [ _WidgetBase, _TemplatedMixin ], {
	//DECLARATION
	templateString : '<div class="RadioButtonList"><div style="float:none;clear:both"></div></div>',
	inputargs: {
		name : '',
		direction : 'horizontal',
		captiontrue: 'true',
		captionfalse: 'false',
		onchangeAction: '',
		readonly : false
	},
	
	//IMPLEMENTATION
	mendixobject : null,
	attrDisable :false,
	selectedValue : '',
	keyNodeArray : null,
	
	
	// updates the widget with a new dataobject
	setDataobject : function(mxObject) {
		logger.debug(this.id + ".setDataobject");
		//load embedded
		var loaded = false;
		var errorhandled = false;



		this.mendixobject = mxObject;

		if (mxObject != null) {
			try {
				if (this.name != '') {
					var enumerationObj;
					//get enumeration for current attribute
					if(mxObject.getAttributeType(this.name) == 'Enum')
						enumerationObj = mxObject.getEnumKVPairs(this.name);
					else if(mxObject.getAttributeType(this.name) == 'Boolean')
					{
						enumerationObj = {};
						enumerationObj['true'] = this.captiontrue;
						enumerationObj['false'] = this.captionfalse;
					}
					this.initRadioButtonList(enumerationObj);
					loaded = true;
				}
			}
			catch (err) {
				console && console.error(this.id +'.setDataobject: error while loading attr ' + err);
				loaded = false;
			}

			var self = this;

			mx.data.subscribe({
			    guid     : mxObject.getGuid(),
			    val      : true,
			    callback : function(validations) {
			    	if(self.readonly){
			    		validations[0].removeAttribute(self.name);
			    	} else {
				    	var reason = validations[0].getReasonByAttribute(self.name);
						if(query('.alert', self.domNode).length > 0) {
							domConstruct.destroy(query('.alert', self.domNode)[0]);
						}
				        var div = dom.create('div', {'class' : 'alert alert-danger'});
				        mxui.dom.textContent(div, reason);
				        domConstruct.place(div, self.domNode, 'last');
				        validations[0].removeAttribute(self.name);
			    	}
			    }
			});

		}
		else
			logger.warn(this.id + '.setDataobject: received null object');
	},
	
	initRadioButtonList : function(enumObj){
		var i = 0;
		domConstruct.empty(this.domNode);
		var attrName = "" + this.mendixobject.get(this.name);
		for (var key in enumObj) {
			var radioid = this.name+'_'+this.id+'_'+i;
			var radiodiv = this.direction == 'horizontal' ? dom.create('div', {'class' : 'radio-inline'}) : dom.create('div', {'class' : 'radio'});
			var rbNode = dom.create("input", {
				'type' : 'radio',
				'value' : key,
				//'name' : "radio"+this.mendixobject.getGUID()+'_'+this.id,
				'id' : radioid
			});
			//MWE: name is set here, because otherwise it will result in a
			//"INVALID_CHARACTER_ERR (5)" exception,
			//which is a result of the fact that document.createElement("<tagname baldibla='basdf'>") is not allowed anymore
			domAttr.set(rbNode, 'name',  "radio"+this.mendixobject.getGuid()+'_'+this.id);
			
			
			this.keyNodeArray[key] = rbNode;
			
			var labelNode = dom.create("label");
			domAttr.set(labelNode,'for', radioid);
			domAttr.set(labelNode, 'disabled', this.attrDisable);
			
			domAttr.set(rbNode, 'disabled', this.attrDisable);

			if (attrName == key) {
				domAttr.set(rbNode,'defaultChecked', true);
				this.selectedValue = key;
			}

			var textDiv = dom.create("span", null, enumObj[key]);
			domStyle.set(textDiv, { cursor : 'default' });
			this.connect(rbNode, "onclick", lang.hitch(this, this.onChangeRadio, rbNode, key));
			this.connect(textDiv, "onclick", lang.hitch(this, this.onChangeRadio, rbNode, key));
			
			var listItemNode = dom.create("li", null, textDiv);
			
			labelNode.appendChild(rbNode);
			labelNode.appendChild(textDiv);
			radiodiv.appendChild(labelNode);
			
			//TODO: add the radio div.
			this.domNode.appendChild(radiodiv);
			i++;
		}
	},
 
	onChangeRadio : function(rbNode, enumkey) {
		logger.debug(this.id + ".onChangeRadio");
		if (this.attrDisable)
			return;

			domAttr.set(rbNode,'checked', true);
		this.selectedValue = enumkey;
		this._setValueAttr(enumkey);
		this.onChange();
		this.triggerMicroflow();
	},
 
	//invokes the microflow coupled to the tag editor
	triggerMicroflow : function() {
		logger.debug(this.id + ".triggerMicroflow");
		
		if (this.onchangeAction) {
			mx.data.action({
				params: {
					applyto     : 'selection',
					actionname  : this.onchangeAction,
					guids       : [this.mendixobject.getGuid()]
				},
				error       : function() {
					logger.error("RadioButtonList.widget.AssocRadioButtonList.triggerMicroFlow: XAS error executing microflow")
				}
			});
		}
	},
	
 	_setDisabledAttr : function (value) {
		if (!this.readonly)
			this.attrDisable = !!value;
	},
	
	_getValueAttr : function () {
		return this.selectedValue;
	},
	
	_setValueAttr : function (oldvalue) {
		var value = oldvalue;

		if ( this.selectedValue !== null) {
			if (  this.selectedValue != '' && this.keyNodeArray[this.selectedValue] ) {
				this.keyNodeArray[this.selectedValue].checked = false;
				this.keyNodeArray[this.selectedValue].defaultChecked = false;
			}
		}
		if (this.mendixobject !== null) {

			if(this.mendixobject.isBoolean(this.name)) {
				var boolvalue = oldvalue == 'true' ? true : false;
				this.mendixobject.set(this.name, boolvalue);
				this.selectedValue = boolvalue;
			} else {
				this.mendixobject.set(this.name, value);
				this.selectedValue = value;
			}
		}

		if (value !== '' && this.keyNodeArray[value]) {
			this.keyNodeArray[this.selectedValue].checked = true;
			this.keyNodeArray[this.selectedValue].defaultChecked = true;
		}	
	},
	
	//summary : stub function, will be used or replaced by the client environment
	onChange : function(){
	},
	postCreate : function(){
		logger.debug(this.id + ".postCreate");
  
		this.keyNodeArray = {};
		if (this.readonly)
			this.attrDisable = true;
	
		// this.initContext();
		// this.actRendered();
	},
 
	applyContext : function(context, callback){
		logger.debug(this.id + ".applyContext");
		
		if (context) {
			mx.data.get({
				guid: context.getTrackId(),
				callback: lang.hitch(this, this.setDataobject)
			});
		} else
			logger.warn(this.id + ".applyContext received empty context");
		callback && callback();
	},
	
	uninitialize : function(){
		logger.debug(this.id + ".uninitialize");
	}
		});
	});

require([ "RadioButtonList/widget/AttrRadioButtonList" ]);

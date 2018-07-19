/**
 * 带提示信息的 输入框
 * @author ming
 */
 (function($){
    'use strict';
  
    var Util = {};
    Util.escapeHtml = function(text){
    	 if(text){
        return text.replace(/[<>"'&/]/g, function(match){
          switch(match){
            case "<": return "&lt;";
            case ">":return "&gt;";
            case "&":return "&amp;";
            case "'":return "&#39;";
            case "\"":return "&quot;";
            case "/":return "&#x2F;";
          }
        });
		    }
      return text;
    };

    $.fn.initTipInput = function (options) {
        return new TipInput(this, options);
    };

    function TipInput(jqobj, options) {
        this.jqobj = jqobj;
        this.options = $.extend({}, this.defaultOptions, options);
        this.init();
        return this;
    }

    TipInput.prototype = {
        defaultOptions: {
            maxItem: 3,  //最多可以填入几个内容
            database: [],  //提示信息数据库
            isValidCallback: null,   //是否合法的回调，设置一个callback 可以限定每个item
            allowUserDefined: true   //是否允许自定义输入（不依赖database）
        },

        init: function () {
            this.container = $("<div class='sys-tip-wrap-container'></div>");
            this.inputObj = $("<div class='sys-tip-input'><div class='sys-tip-item-container'></div><input class='sys-tip-main-input'></div>");
            this.tipContainer = $("<div class='sys-tip-container'><div class='message'></div><ul class='choose-pannel'></ul></div>");
            this.jqobj.append(this.container);
            this.container.append(this.inputObj);
            this.tipContainer.insertAfter(this.inputObj);
            this.items = [];
            this._switch = "on";
            this.addEventListener();
        },

        getInputVal: function () {
            var inputVal = this.inputObj.find(".sys-tip-main-input").val();
            inputVal = inputVal.replace(/(^\s*)|(\s*$)/, '');
            return inputVal;
        },

        addEventListener: function () {
            var thisobj = this;

            thisobj.shouldBeRemove = false; //按两次才会删除 防止误删
            thisobj.inputObj.on("keyup", ".sys-tip-main-input", function (e) {
                if (thisobj._switch === "on") {
                    var inputVal = $(this).val();
                    inputVal = inputVal.replace(/(^\s*)|(\s*$)/, '');
                    if (e.keyCode === 38 || e.keyCode === 40 || e.keyCode === 13 || e.keyCode === 8) {
                        //up || down  || enter || backspace
                        if (e.keyCode === 8) {
                            if (thisobj.inputObj.find(".sys-tip-main-input").val().length === 0) {
                                if (thisobj.shouldBeRemove) {
                                    thisobj.inputObj.find(".sys-tip-item:last").find(".sys-tip-item-del").trigger("click");
                                }
                                thisobj.shouldBeRemove = !thisobj.shouldBeRemove;
                            } else {
                                thisobj.shouldBeRemove = false;
                            }
                            thisobj.showTipContainer(inputVal);
                        } else if(e.keyCode === 38 || e.keyCode === 40) {
                            if(thisobj.tipContainer.find(".choose-pannel").is(":visible") && thisobj.tipContainer.find(".choose-item").length > 0) {
                                var itemLength = thisobj.tipContainer.find(".choose-item").length;
                                var index = thisobj.tipContainer.find(".choose-pannel .hover").index();
                                if(e.keyCode === 38) {
                                    if(index === 0) {
                                        index = itemLength;
                                    }
                                    index --;
                                } else {
                                    index ++;
                                }
                                thisobj.tipContainer.find(".choose-item").removeClass("hover");
                                index = index % itemLength;
                                if(index >= 0) {
                                    thisobj.tipContainer.find(".choose-item").eq(index).addClass("hover");
                                    thisobj.tipContainer.find(".choose-pannel").scrollTop(0);
                                    var top = thisobj.tipContainer.find(".choose-item.hover").offset().top - thisobj.tipContainer.offset().top;
                                   if(top) {
                                       thisobj.tipContainer.find(".choose-pannel").scrollTop(top - 30);
                                   }
                                }
                            }
                        } else {
						   var isGoingToChooseSomeItem = thisobj.tipContainer.find(".choose-pannel").is(":visible")
									&& thisobj.tipContainer.find(".choose-pannel .hover").length > 0 ;
							if (isGoingToChooseSomeItem) {
								var index = thisobj.tipContainer.find(".choose-pannel .hover").index();
								thisobj.tipContainer.find(".choose-item").eq(index).trigger("click");
							} else {
								thisobj.addItem(inputVal);
							}
                        }
                    } else {
                        thisobj.shouldBeRemove = false;
                        thisobj.showTipContainer(inputVal);
                    }
                }

            });

            thisobj.inputObj.on("focus", ".sys-tip-main-input", function () {
                if (thisobj._switch === "on") {
                    thisobj.showTipContainer(thisobj.getInputVal());
                }
            });

            thisobj.blurLock = false;
            thisobj.inputObj.on("blur", ".sys-tip-main-input", function () {
                if (thisobj._switch === "on") {
                    var inputVal = $(this).val();
                    if (thisobj.blurLock === false) {
                        inputVal = inputVal.replace(/(^\s*)|(\s*$)/, '');
                        thisobj.addItem(inputVal);
                    }
                }
            });

            thisobj.tipContainer.on("mouseenter", function () {
                thisobj.blurLock = true;
            });

            thisobj.tipContainer.on("mouseleave", function () {
                thisobj.blurLock = false;
            });

            thisobj.inputObj.on("click", ".sys-tip-item-del", function () {
                var index = $(this).parent(".sys-tip-item").index();
                thisobj.delItem(index);
            });

            thisobj.tipContainer.on("click", ".choose-item", function () {
                if (thisobj._switch === "on") {
                    var index = $(this).data("index");
                    var inputVal = thisobj.options.database[index];
                    thisobj.addItem(inputVal);
                    thisobj.blurLock = false;
                }
            });
        },

        addItem: function (val) {
            var thisobj = this;
            thisobj.hideTipContainer();
            if(!thisobj.options.allowUserDefined) {
                var containedByDatabase = false;
                for(var i=0,l=thisobj.options.database.length;i<l;i++){
                    if(val === thisobj.options.database[i]) {
                        containedByDatabase = true;
                        break;
                    }
                }
                if(!containedByDatabase){
                    //没有输入要求输入的值
                    thisobj.inputObj.find(".sys-tip-main-input").val("");
                    return;
                }
            }
            var isValid = (thisobj.options.isValidCallback ? thisobj.options.isValidCallback(val) : true);
            if (val && val.length > 0 && isValid) {
                thisobj.inputObj.find(".sys-tip-main-input").val("");
                var escapeVal = Util.escapeHtml(val);
                var item = $("<div class='sys-tip-item' data-value='" + escapeVal + "' title='" + escapeVal + "'><div class='sys-tip-item-val'>" + escapeVal + "</div><div class='sys-tip-item-del'></div></div>");
                thisobj.inputObj.find(".sys-tip-item-container").append(item);
                thisobj.items.push(val);
                if (thisobj.items.length >= thisobj.options.maxItem) {
                    thisobj.stopAdd();
                }
                thisobj.freshShow();
            }
        },

        delItem: function (index) {
            var thisobj = this;
            if (!isNaN(index) && thisobj.items.length > index) {
                thisobj.items.splice(index, 1);
                thisobj.inputObj.find(".sys-tip-item").eq(index).remove();
                if (thisobj.items.length < thisobj.options.maxItem) {
                    thisobj.startAdd();
                }
                thisobj.freshShow();
            } else {
                console.error("erro index to delete");
            }
        },

        stopAdd: function () {
            this.inputObj.find(".sys-tip-main-input").hide();
            this._switch = "off";
        },

        startAdd: function () {
            this.inputObj.find(".sys-tip-main-input").show();
            this._switch = "on";
        },

        showTipContainer: function (val) {
            var chooseItemsHtml = "";
            var database = this.options.database;
            if (database.length <= 0) {
                return;
            }
            for (var i = 0, l = database.length; i < l; i++) {
                if (database[i].indexOf(val) >= 0) {
                    chooseItemsHtml += "<li class='choose-item' data-index='" + i + "'>" + Util.escapeHtml(database[i]) + "</li>";
                }
            }

            if (chooseItemsHtml.length > 0) {
                this.tipContainer.find(".message").hide();
                this.tipContainer.find(".choose-pannel").html(chooseItemsHtml);
                this.tipContainer.find(".choose-pannel").show();

            } else {
                this.tipContainer.find(".choose-pannel").hide();
                this.tipContainer.find(".message").html("<span>未找到匹配项</span>");
                this.tipContainer.find(".message").show();
            }

            this.tipContainer.show();
        },

        hideTipContainer: function () {
            this.tipContainer.hide();
        },

        getItems: function () {
            return this.items;
        },

        reset: function () {
            this.items = [];
            this._switch = "on";
            this.inputObj.find(".sys-tip-item").remove();
            this.inputObj.find(".sys-tip-main-input").val("").show();
            this.freshShow();
        },

        resetOptions: function (options) {
            this.options = $.extend({}, this.defaultOptions, options);
        },

        resetOption:function(key, val){
            for(var k in this.options) {
                if(k === key) {
                    this.options[k] = val;
                }
            }
            return this;
        },

        freshShow: function () {
            var width = 0;
            this.inputObj.find(".sys-tip-item").each(function (i, obj) {
                width += $(obj).outerWidth(true);
            });

            var inputWidth = Math.max(80, (175 - (this.inputObj.find(".sys-tip-item").length * 50)));
            this.inputObj.find(".sys-tip-main-input").css("width", inputWidth + "px");

            if(this.inputObj.find(".sys-tip-main-input").is(":visible")) {
                width += this.inputObj.find(".sys-tip-main-input").outerWidth(true);
            } 
			width += 6;//最右面留点空隙
            width = Math.max(width, 182);
            this.inputObj.css("width", width + "px");
        }
    };
 }($));

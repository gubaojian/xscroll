define(function(require, exports, module) {
	var Util = require('./util');
	var prefix;
	var containerCls;
	var loadingContent = "Loading...";
	var upContent = "Pull Up To Refresh";
	var downContent = "Release To Refresh";
	var pageEndContent = "Last Page";
	var PULL_UP_HEIGHT = 60;
	var HEIGHT = 40;

	var PullUp = function(cfg) {
		var self = this;
		self.__events = {};
		self.userConfig = Util.mix({
			upContent:upContent,
			downContent:downContent,
			pageEndContent:pageEndContent,
			pullUpHeight: PULL_UP_HEIGHT,
			height:HEIGHT,
			autoRefresh: true, //是否自动刷新页面
			loadingContent: loadingContent,
			boundry:{},
			prefix: "xs-plugin-pullup-"
		}, cfg);
	}
	Util.mix(PullUp.prototype, {
		pluginId: "xscroll/plugin/pullup",
		pluginInitializer: function(xscroll) {
			var self = this;
			self.xscroll = xscroll;
			prefix = self.userConfig.prefix;
			if (self.xscroll) {
				self.xscroll.on("afterrender", function() {
					self.render()
				})
			}
		},
		pluginDestructor: function() {
			var self = this;
			self.pullup && self.pullup.remove();
			self.xscroll.detach("scroll", self._scrollHandler);
			delete self;
		},
		render: function() {
			var self = this;
			if (self.__isRender) return;
			self.__isRender = true;
			var containerCls = prefix + "container";
			var height = self.userConfig.height;
			var pullup = self.pullup = document.createElement("div");
			pullup.className = containerCls;
			pullup.style.position = "absolute";
			pullup.style.width = "100%";
			pullup.style.height = height + "px";
			pullup.style.bottom = -height + "px";
			self.xscroll.container.appendChild(pullup);
			self.xscroll.boundry.expandBottom(40);
			Util.addClass(pullup, prefix + self.status);
			pullup.innerHTML = self.userConfig[self.status + "Content"] || self.userConfig.content;
			self._bindEvt();
		},
		_bindEvt: function() {
			var self = this;
			if (self._evtBinded) return;
			self._evtBinded = true;
			var pullup = self.pullup;
			var xscroll = self.xscroll;
			xscroll.on("pan", function(e) {
				self._scrollHandler(e);
			});
			//load width a buffer
			if(self.userConfig.bufferHeight > 0){
				xscroll.on("scroll",function(e){
					
					if(!self.isLoading &&  Math.abs(e.offset.y) + xscroll.height +  self.userConfig.height + self.userConfig.bufferHeight >= xscroll.containerHeight + xscroll.boundry._xtop + xscroll.boundry._xbottom){
						console.log(Math.abs(e.offset.y))
						self._changeStatus("loading");
					}
				});
			}
			//bounce bottom
			xscroll.on("scrollend",function(e){
				if(e.directionY == "top" && e.offset.y ==  xscroll.height - xscroll.containerHeight - self.userConfig.height){
					self._changeStatus("loading");
				}
			})
		},
		_scrollHandler: function(e) {
			var self = this;
			var xscroll = self.xscroll;
			var offsetTop = xscroll.getOffsetTop();
			if (offsetTop <  xscroll.height - xscroll.containerHeight - self.userConfig.pullUpHeight) {
				self._changeStatus("down")
			}else{
				self._changeStatus("up");
			}
		},
		_changeStatus: function(status) {
			if(status != "loading" && this.isLoading) return;
			var prevVal = this.status;
			this.status = status;
			Util.removeClass(this.pullup, prefix + prevVal)
			Util.addClass(this.pullup, prefix + status);
			this.setContent(this.userConfig[status + "Content"]);
			if(prevVal != status){
				this.fire("statuschange",{
					prevVal:prevVal,
					newVal:status
				});
				if(status == "loading"){
					this.isLoading = true;
					this.fire("loading");
				}
			}
		},
		complete:function(){
			var self = this;
			self.isLoading = false;
			self._changeStatus("up");
			if(!self.userConfig.bufferHeight) return;
			var trans = self.xscroll._bounce("y",self.xscroll._prevSpeed);
            trans && self.xscroll.scrollY(trans.offset,trans.duration,trans.easing);
		},
		reset:function(callback){
        	this.xscroll.boundry.resetBottom()
			this.xscroll.bounce(true, callback);
			this._expanded = false;
        },
		fire: function(evt) {
            var self = this;
            if (self.__events[evt] && self.__events[evt].length) {
                for (var i in self.__events[evt]) {
                    self.__events[evt][i].apply(this,[].slice.call(arguments, 1));
                }
            }
        },
        on: function(evt, fn) {
            if (!this.__events[evt]) {
                this.__events[evt] = [];
            }
            this.__events[evt].push(fn);
        },
        detach: function(evt, fn) {
            if (!evt || !this.__events[evt]) return;
            var index = this.__events[evt].indexOf(fn);
            if (index > -1) {
                this.__events[evt].splice(index, 1);
            }
        },
		setContent: function(content) {
			var self = this;
			if (content) {
				self.pullup.innerHTML = content;
			}
		}
	})

	if(typeof module == 'object' && module.exports){
		module.exports = PullUp;
	}else{
		return PullUp;
	}
	
});
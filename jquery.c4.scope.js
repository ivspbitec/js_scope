/*######## jQuery C4 Scope ###################################################
	
	Баги 1://!!!Нет поддержки разных доменов скопа и элементов

   2015-03-19 Поддержка относительных путей в некст прев страницах
   2016-01-13 Поддержка нескольких наборов скопов в элементе
   
	Version: 		0.0.9
	Description: 	Automatic navigation filtering and other itemsets paged.
	Example: 		$('[data-scope]').c4_scope();  //init scopes based on items dom 
	Example: 		$('[data-scope-element]').c4_scope();  //init scopes based on element dom 
	Example: 		$.c4_scope_;  //Scope class
	Events:			on_scope_end - when scope end
	Events:			on_scope_start - when scope end
	Events:			on_scope_hrefs - when scope end
	Markups:

	On items list page:
		<div 
			data-scope='uniquid' 
			data-scope-next='{NEXTPAGE}' 
			data-scope-prev='{PREVPAGE}' 
			data-scope-title-func='return document.title' 
			data-scope-title='{COMPOUND_SCOPE_TITLE}'

			data-scope-count='{COUNT}' 
			data-scope-from='{COUNT}' [!NOT DONE]
		>
			<div data-scope-url="{i.URL}" data-scope-title="{i.TITLE}"></div>
			<div data-scope-url="{i.URL}" data-scope-title="{i.TITLE}"></div>
		</div>		
	<script>$('[data-scope]').c4_scope();</script>

	On Item page:
	<div data-scope-element='uniquid,uniquid2,uniquid3'>
		<div class='scope_element_info'></div>  
		<a class='scope_element_info_title'>В список</a>   
		<a class='scope_arrow_prev'></a>   
		<a class='scope_arrow_next'></a>
	</div>
	
	<script>$('[data-scope-element]').c4_scope();</script>
*/

(function($){
		
	$.c4_scope_=function(options,element) {	
		this.$el = $(element);	
		this._init(options);		
	};
	
	$.c4_scope_.defaults = { //Default parametrs
		callback	: false, 	// FUNCTION When all prepared (this.next_item, this.prev_item, this.scope)
		cache:	false,// Next page cache
		renew:	false,// Recreate instance on call (for dynamic ajax content)
		verbose:	false,// Verbosre work
		cache_depth: 5,// Depth of cache in scope [!NOT DONE] 
    };
	
	var _error = function(message) { //1.0 Error reporting
		if (console){
			console.error( message );
		}
	};
	
	$.c4_scope_.prototype = {
		_init: function(options) {			
			var _this=this;
	/*######## Assign options  ###################################################*/
			_this.options 		= $.extend( true, {}, $.c4_scope_.defaults, options );
			
	/*######## Assign elements  ###################################################*/

			this.id=this.$el.data('scope');
			this.element_id=this.$el.data('scope-element');
			if (!this.id && !this.element_id) return _error('c4_scope_: No data-scope="" or  data-scope-element="" identificator found on root scope object');
			this.id=this.id?this.id:this.element_id;
			this.location=location.href.split('#')[0];
			this.scope={};
			var n=false; //Номер текущего элемента в последовательности
			
			if (this.element_id){ //1.2 element init	
				if (_this.options.verbose) console.log('c4_scope::element_init ('+this.element_id+')');
				
				var element_id_arr=_this.element_id.split(','); //Ищем несколько идентификаторов
				for (var element_id_arr_n in element_id_arr){
					if (!n){
						var temp_element_id=element_id_arr[element_id_arr_n];
						_this.scope=_this._load_scope(temp_element_id);
						if (_this.options.verbose) console.log('c4_scope::Search items in scope');	
						if (_this.options.verbose) console.log(_this.scope);	
						n=_this._find_item_url(_this.scope.items,_this.location);
					}
				}
 
				
				this.$info=$(".scope_element_info");
				
				if (!this.$info.size()){
					this.$info=$( '<div class="scope_element_info" />' );
					this.$el.append(this.$info);
				}
				this.$info.html('');			
				var $info_inner=$( '<div class="scope_element_info_inner" />' );				
				var $info_close=$( '<div class="scope_element_info_close hand" />' ).append('<span>&times;</span>');
				$info_inner.append($info_close);
				
				this.$prev=$('.scope_arrow_prev');
				if (!this.$prev.size()){
					this.$prev=$('<a class="scope_arrow_prev"><b></b><span>< Previous</span></a>' );	
					$info_inner.append(this.$prev);
				}				
				
				this.$next=$('.scope_arrow_next');
				if (!this.$next.size()){
					this.$next=$('<a class="scope_arrow_next"><b></b><span>Next ></span></a>' );	
					$info_inner.append(this.$next);
				}				
				

				
				if (!n){
					this.$info.hide();
					return;
				}else{	
					//_this._save_data('sc4_scopes_last_scope_id',_this.scope.id);
			
					_this.scope.current=1*n+1;
					
					_this.next_item=null;
					_this.prev_item=null;
					
					var on_all_hrefs_recived=function(){ //When recived all hrefs
 						if (_this.options.callback) _this.options.callback.apply(_this);
 						if (_this.options.cache) _this.cache(_this.next_item.url);
						_this.$el.trigger('on_scope_hrefs',_this);
					}
 					
					_this._get_next_item(_this.location,_this.scope,function(next_item){
						if (next_item){
							_this.$next.attr('href',next_item.url).attr('title',next_item.title);
						}else{
							_this.$next.addClass('scope_inacive').attr('href','#');
							_this.$el.trigger('on_scope_end',_this);
						}			
						_this.next_item=next_item;
						if (_this.next_item!==null && _this.prev_item!==null) 
							on_all_hrefs_recived();
					});						
					
					_this._get_prev_item(_this.location,_this.scope,function(prev_item){
						if (prev_item){
							_this.$prev.attr('href',prev_item.url).attr('title',prev_item.title);
						}else{
							_this.$prev.addClass('scope_inacive').attr('href','#');
							_this.$el.trigger('on_scope_start',_this);
						}	
						
						_this.prev_item=prev_item;
						if (_this.next_item!==null && _this.prev_item!==null) 
							on_all_hrefs_recived();
					});	
					
					
				 
					var $info_inner_title=$('<div class="scope_element_info_inner_title" />');
					var $info_title_count=(_this.scope.count)?$(' <span class="scope_element_info_count hand">'+_this.scope.current+' ('+_this.scope.count+')</span>'):'';
				
					var $info_title=$('.scope_element_info_title');
					var $info_title_label=$('<span />');
				
					if (!$info_title.size()){							
						$info_title=$('<a class="scope_element_info_title hand" />');	
						$info_title_label.text(_this.scope.title);	
						$info_inner_title.append($info_title.append($info_title_label)).append($info_title_count);
					} 
					$info_title.attr('href',_this.scope.location);
 
					_this.$info.append($info_inner.append($info_inner_title));
 
					$info_close.on('click.c4_scope',function(){
						_this._delete_scope(_this.id); 
						_this.$info.fadeOut();
						window.location.reload();
					})	
					
				}			
					
			}else{//items init
				if (_this.options.verbose) console.log('c4_scope::items_init ('+this.id+')');
				_this._delete_scope(_this.id); 
				_this.scope.id=_this.id;
				_this.scope.title=_this.$el.data('scope-title');
				_this.scope.count=_this.$el.data('scope-count');
				_this.scope.from=_this.$el.data('scope-from');
				_this.scope.current=false;
				
				_this.scope.location=_this.location;	
				_this.scope.next=_this.$el.data('scope-next')?_this.$el.data('scope-next').split('#')[0]:'';				
				_this.scope.next=_this.scope.next.charAt(0)=='?'?_this.scope.location.split('?')[0]+_this.scope.next:_this.scope.next;
				
				_this.scope.prev=_this.$el.data('scope-prev')?_this.$el.data('scope-prev').split('#')[0]:'';
				_this.scope.prev=_this.scope.prev.charAt(0)=='?'?_this.scope.location.split('?')[0]+_this.scope.prev:_this.scope.prev;
													
				if (_this.$el.data('scope-title-func')){				
					try{
						eval('var stf=function(){'+_this.$el.data('scope-title-func')+'}');
						_this.scope.title=stf();
					}catch(e){
						_error('c4_scope_: scope-title-func error: '+e);
					}
				}
	
				_this.scope.items=_this._array_append(_this.scope.items,_this._get_items(_this.$el.html(),_this.scope.items)); 
				if (_this.options.verbose) console.log(_this.scope);
				_this._save_scope(_this.id,_this.scope);
 			 
			}
 

	/*######## Create elements  ###################################################*/ 
			//var $n		= $( '<nav class="c4_scope-nav"/>' );
			//$n.appendTo( this.$el );
			
	/*######## Assign events  ###################################################*/ 
			this._events();					
		},
		
		cache:function(url){ //Cache url	
			$(window).on('load', function(){	
				$.get(url,function(d){
					$(d).find('img').each(function(){
						var image = new Image();
						image.src = $(this).attr('src');							
					});
				})			
			}); 

	 
		},
		   
		_events	: function() {			
 		
		}, 	
		
		_get_prev_item:function(url,scope,callback){
			var _this=this;	
			var n=1*_this._find_item_url(scope.items,url);
			if (!scope.items[n-1]){
				if (_this.scope.prev){
					$.get(scope.prev,function(d){
						var $el=$(d).find('[data-scope="'+scope.id+'"]');
						scope.prev=$el.data('scope-prev')?$el.data('scope-prev').split('#')[0]:'';
						var new_items=_this._get_items($el.html(),scope.items);					
						if (new_items.length){						
							scope.items=_this._array_append(new_items,scope.items); 						
							var n=1*_this._find_item_url(scope.items,url);						
							_this._save_scope(scope.id,scope);
							if (scope.items[n-1]){
								if (callback) callback(scope.items[n-1]);
							}							
						}else{
							scope.prev='';
							_this._save_scope(scope.id,scope);
							if (callback) callback(false);
						}		
								
					});
				
				}else{
					if (callback) callback(false);
				}			
			}else{		
				if (scope.items[n-1]){
					if (callback) callback(scope.items[n-1]);
				}
			}
		},
		
		_get_next_item:function(url,scope,callback){
			var _this=this;	
			var n=1*_this._find_item_url(scope.items,url);
			if (!scope.items[n+1]){
				if (_this.scope.next){
 
					$.get(scope.next,function(d){
						var $el=$(d).find('[data-scope="'+scope.id+'"]');
						
						scope.next=$el.data('scope-next')?$el.data('scope-next').split('#')[0]:'';
 
						var new_items=_this._get_items($el.html(),scope.items);
 
						if (new_items.length){
							scope.items=_this._array_append(scope.items,new_items); 
							_this._save_scope(scope.id,scope);
							if (scope.items[n+1]){
								if (callback) callback(scope.items[n+1]);
							}							
						}else{
							scope.next='';
							_this._save_scope(scope.id,scope);
							if (callback) callback(false);
						}		
 						
					});
				
				}else{
					if (callback) callback(false);
				}			
			}else{	
				
				_this._save_scope(scope.id,scope);
				if (scope.items[n+1]){
					if (callback) callback(scope.items[n+1]);
				}
			}
		},
		
		_find_item_url:function(items,u) {
			var found=false; 
			for (var n in items) 
					if (items[n].url==u) 
						found=n;
			return found;
		},
		
		_get_items: function(html,items){ //1.1 Собрать элемент скопа
			var _this=this;		 
			var items=items?items:[];
			var new_items=[];
			html='<div>'+html+'</div>';
 
			$(html).find('[data-scope-url]').each(function(){
				var h=window.location.hostname; 
				var p=window.location.protocol;
				var u=$(this).data('scope-url').split('#')[0];

				if (u){
					u=(u.indexOf(h)==-1)?p+'//'+h+u:u;
					
					var title=$(this).data('scope-title');
					if (!_this._find_item_url(items,u)){
						if (!u){
							_error('c4_scope_: scope-items-url error: url not found in scope "'+_this.scope.id+'" scopee.item "'+title+'" ['+new_items.length+'] ');
						}else{
							new_items[new_items.length]={
								url:u,
								title:title
							}
						}
					}
				}
			});		
			return new_items;
		},
		
		_array_append: function(a1,a2){
			var new_items=[];
			for (var n in a1) new_items[new_items.length]=a1[n];
			for (var n in a2) new_items[new_items.length]=a2[n];			
			return new_items;
		},	
 				
		_load_scope:function(id){
			var scope=this._load_data('sc4_scopes_'+id);
			return (!scope)?{}:scope;
		},
		
		_save_scope:function(id,data){
			this._save_data('sc4_scopes_'+id,data);
		},		
		
		_delete_scope:function(id){
			this._save_data('sc4_scopes_'+id,'');
		},		
		
		_save_data:function(key,json){
			window.sessionStorage.setItem(key,JSON.stringify(json));
		},

		_load_data:function(key){
			try{
				eval('var data='+window.sessionStorage.getItem(key));
				return data;
			}catch(e){
				return false;
			}
		}

/*######## Public methods (no _) ###################################################*/		
	
	
	};
		
	$.fn.c4_scope = function(options) {
		if ( typeof options === 'string' ) {			
			var args = Array.prototype.slice.call(arguments, 1);		
			
			this.each(function() {			
				var instance = $(this).data('c4_scope');				
				
				if (!instance){
					_error( "c4_scope: Сannot call method '" + options + "' before initialization" );
					return;
				}
				
				if ( !$.isFunction(instance[options])){
					logError( "c4_scope: No such method '" + options + "' in instance" );
					return;
				}
				
				if ( options.charAt(0) === "_" ){
					logError( "c4_scope: Try to execute private method '" + options + "' for instance" );
					return;
				}				
				instance[options].apply(this,args);			
			});		

		}else {		
			this.each(function() {
				var instance = $(this).data('c4_scope'); 
				if ( !instance || options.renew) {
					 $(this).data('c4_scope', new $.c4_scope_(options,this)); 
				}
			});
		
		}
		
		return this;
		
	};
	
})( jQuery );


 



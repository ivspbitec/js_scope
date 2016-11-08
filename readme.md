Dynamic scope navigator Plugin
===========================

* System independed
* Cache controled


Cross-platform Compatibility
----------------------------

* Firefox 2+
* Safari 3+
* Opera 9.5+
* Google Chrome 0.2+
* Internet Explorer 6+
 
##On items page:
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
	
##On item page:
	<div data-scope-element='uniquid'>
		<div class='scope_element_info'></div>  
		<a class='scope_element_info_title'>В список</a>   
		<a class='scope_arrow_prev'></a>   
		<a class='scope_arrow-next'></a>
	</div>
	
	<script>$('[data-scope-element]').c4_scope();</script>
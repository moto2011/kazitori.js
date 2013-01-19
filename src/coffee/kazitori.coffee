###
	(c) 2013 Eikichi Yamaguchi
	kazitori.js may be freely distributed under the MIT license.
	http://dev.hageee.net

	fork from::
//     (c) 2010-2012 Jeremy Ashkenas, DocumentCloud Inc.
//     Backbone may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://backbonejs.org
###

#delegate
delegater = (target, func)->
	return ()->
		func.apply(target, arguments)

#regexps
trailingSlash = /\/$/
routeStripper = /^[#\/]|\s+$/g
escapeRegExp = /[\-{}\[\]+?.,\\\^$|#\s]/g
namedParam = /:\w+/g
optionalParam = /\((.*?)\)/g
splatParam = /\*\w+/g


###
# ほとんど Backbone.Router と Backbone.History から拝借。
# jQuery や underscore に依存していないのでいろいろなライブラリと組み合わせられるはず。
# もっと高級なことしたけりゃ素直に Backbone 使うことをおぬぬめ。
#
###
class Kazitori
	VERSION:"0.1.2"
	history:null
	location:null
	handlers:[]
	beforeHandlers:[]
	afterhandlers:[]
	root:null
	allBeforeHandler:null

	breaker:{}


	constructor:(options)->
		@.options = options || (options = {})

		if options.routes
			@.routes = options.routes
		
		@.root = if options.root then options.root else '/'

		win = window
		if typeof win != 'undefined'
			@.location = win.location
			@.history = win.history
		docMode = document.docmentMode
		@isOldIE = (win.navigator.userAgent.toLowerCase().indexOf('msie') != -1) and (!docMode||docMode < 7)

		@_bindBefores()
		@_bindRules()

		if "isAutoStart" not in options or options["isAutoStart"] != false
			@start()
		return


	#開始する
	start:(options)->
		if Kazitori.started
			throw new Error('mou hazim matteru')
		Kazitori.started = true
		win = window
		@.options = @_extend({}, {root:'/'}, @.options, options)
		@._hasPushState = !!(@.history and @.history.pushState)
		@._wantChangeHash = @.options.hashChange isnt false
		fragment = @getFragment()
		atRoot = @.location.pathname.replace(/[^\/]$/, '$&/') is @.root

		if @isOldIE and @._wantChangeHash
			frame = document.createElement("iframe")
			frame.setAttribute("src","javascript:0")
			frame.setAttribute("tabindex", "-1")
			frame.style.display = "none"
			document.body.appendChild(frame)
			@.iframe = frame.contentWindow
			@change(fragment)

		if @._hasPushState is true
			win.addEventListener 'popstate', delegater(@, @observeURLHandler)
		else if @._wantChangeHash is true and ('onhashchange' in win) and not @.isOldIE
			win.addEventListener 'hashchange', delegater(@, @observeURLHandler)

		if @._hasPushState and atRoot and @.location.hash
			@.fragment = @.getHash().replace(routeStripper, '')
			@.history.replaceState({}, document.title, @.root + @.fragment + @.location.search)
			# return

		if !@.options.silent
			return  @loadURL()


	#止める
	stop:()->
		win = window
		win.removeEventListener 'popstate', arguments.callee
		win.removeEventListener 'hashchange', arguments.callee


	#url を変更する
	change:(fragment, options)->
		if not Kazitori.started
			return false

		if not options
			options = {'trigger':options}
		frag = @getFragment(fragment || '')
		if @.fragment is frag
			return
		@.fragment = frag
		url = @.root + frag

		if @._hasPushState
			@.history[ if options.replace then 'replaceState' else 'pushState' ]({}, document.title, url)
		else if @._wantChangeHash
			@_updateHash(@.location, frag, options.replace)
			if @.iframe and (frag isnt @getFragment(@getHash(@.iframe)))
				if !options.replace
					@.iframe.document.open().close()
				@_updateHash(@.iframe.location, frag, options.replace)
		else
			return @.location.assign(url)

		@loadURL(frag)
		return 

	registHandler:(rule, name, isBefore, callback )->
		if typeof rule isnt RegExp
			rule = @_ruleToRegExp(rule)
		if not callback
			callback = if isBefore then @_bindFunctions(name) else @[name]

		target = if isBefore then @.beforeHandlers else @.handlers
		
		target.unshift {
			rule:rule, 
			callback:@_binder (fragment)->
				args = @._extractParams(rule, fragment)				
				callback && callback.apply(@, args)
			,@
		}
		return @

	#URL を読み込む
	loadURL:(fragmentOverride)->
		fragment = @.fragment = @getFragment(fragmentOverride)
		matched = []

		if @.allBeforeHandler?
			@.allBeforeHandler.callback(fragment)

		for handler in @.beforeHandlers
			if handler.rule.test(fragment)
				handler.callback(fragment)

		for handler in @.handlers
			if handler.rule.test(fragment)
				handler.callback(fragment)
				matched.push true
		return matched


	#URL の変更を監視
	observeURLHandler:(event)->
		current = @getFragment()
		if current is @.fragment and @.iframe
			current = @getFragment(@getHash(@.iframe))
		if current is @.fragment
			return false
		if @.iframe
			@change(current)
		@loadURL() || @loadURL(@getHash())


	# routes から指定されたルーティングをバインド
	_bindRules:()->
		if not @.routes?
			return
		routes = @_keys(@.routes)
		for rule in routes			
			@registHandler(rule, @.routes[rule],false)
		return

	# befores から指定された事前に処理したいメソッドをバインド
	_bindBefores:()->
		if not @.befores?
			return 
		befores = @_keys(@.befores)
		for key in befores
			@registHandler(key, @.befores[key], true)

		if @.allBefores
			callback = @_bindFunctions(@.allBefores)
			@.allBeforeHandler = {
					callback:@_binder (fragment)->
						args = [fragment]						
						callback && callback.apply(@, args)

					,@
				}
		return


	_updateHash:(location, fragment, replace)->
		if replace
			href = location.href.replace /(javascript:|#).*$/, ''
			location.replace href + '#' + fragment
		else
			location.hash = "#" + fragment
		return




	#===============================================
	#
	# URL Querys
	#
	#==============================================

	# URL ルート以下を取得
	getFragment:(fragment)->
		if not fragment?
			if @._hasPushState or !@._wantChangeHash
				fragment = @.location.pathname
				root = @.root.replace(trailingSlash, '')
				if not fragment.indexOf(root)
					fragment = fragment.substr(root.length)
			else
				fragment = @getHash()
		return fragment.replace(routeStripper, '')


	# URL の # 以降を取得
	getHash:()->
		match = (window || @).location.href.match(/#(.*)$/)
		if match?
			return match[1]
		else
			return ''


	#URL パラメーターを取得
	_extractParams:(rule, fragment)->
		return rule.exec(fragment).slice(1)


	#url 正規化後 RegExp クラスに変換
	_ruleToRegExp:(rule)->
		newRule = rule.replace(escapeRegExp, '\\$&').replace(optionalParam, '(?:$1)?').replace(namedParam, '([^\/]+)').replace(splatParam, '(.*?)')
		return new RegExp('^' + newRule + '$')



	#==============================================
	#
	# utils
	#
	#==============================================

	_slice: Array.prototype.slice

	_keys: Object.keys || (obj)->
		if obj is not Object(obj)
			throw new TypeError('object ja nai')
		keys = []
		for key of obj
			if Object.hasOwnProperty.call(obj, key)
				keys[keys.length] = key
		return keys


	_binder:(func, obj)->
		slice = @_slice
		args = slice.call(arguments, 2)
		return ()->
			return func.apply(obj||{},args.concat(slice.call(arguments)))


	_extend:(obj)->
		@_each( @_slice.call(arguments,1), (source)->
			if source
				for prop of source
					obj[prop] = source[prop]
			)
		return obj


	_each:(obj, iter, ctx)->
		if not obj?
			return
		each = Array.prototype.forEach
		if each && obj.forEach is each
			obj.forEach(iter, ctx)
		else if obj.length is +obj.length
			i = 0
			l = obj.length
			while i < l
				if iter.call(ctx, obj[i], i, obj ) is @breaker
					return
				i++
		else
			for k of obj
				if k in obj
					if iter.call(ctx, obj[k], k, obj) is @breaker
						return

	_bindFunctions:(funcs)->		
		if typeof funcs is 'string'
			funcs = funcs.split(',')
		bindedFuncs = []
		for funcName in funcs
			func = @[funcName]
			if not func?
				names = funcName.split('.')
				if names.length > 1
					f = window[names[0]]
					i = 1
					len = names.length
					while i < len
						newF = f[names[i]]
						if newF?
							f = newF
							i++
						else
							break
					func = f
				else
					func = window[funcName]

			if func?
				bindedFuncs.push(func)
		callback =(args)->
			for func in bindedFuncs
				func.apply(@, [args])
			return
		return callback




Kazitori.started = false
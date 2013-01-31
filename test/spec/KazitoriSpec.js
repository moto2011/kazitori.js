var Router, controller, originalLocation,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

controller = {
  beforeAny: function() {
    return console.log('controller.beforeAny');
  },
  beforeShow: function(id) {
    return console.log('controller.beforeShow');
  },
  index: function() {},
  show: function(id) {},
  search: function() {}
};

Router = (function(_super) {

  __extends(Router, _super);

  function Router() {
    return Router.__super__.constructor.apply(this, arguments);
  }

  Router.prototype.beforeAnytime = ["beforeAny"];

  Router.prototype.befores = {
    '/<int:id>': ['beforeShow'],
    '/posts/<int:id>': ['beforeShow']
  };

  Router.prototype.routes = {
    '/': 'index',
    '/<int:id>': 'show',
    '/posts': 'index',
    '/posts/<int:id>': 'show',
    '/posts/new': 'new',
    '/posts/<int:id>/edit': 'edit',
    '/users/<int:id>/posts/<int:id>': 'show'
  };

  Router.prototype.index = function() {
    return controller.index();
  };

  Router.prototype.show = function(id) {
    return controller.show(id);
  };

  Router.prototype.search = function() {
    return controller.search();
  };

  Router.prototype.beforeAny = function() {
    return controller.beforeAny();
  };

  Router.prototype.beforeShow = function(id) {
    return controller.beforeShow(id);
  };

  return Router;

})(Kazitori);

this.router = new Router();

originalLocation = location.href;

window.addEventListener('popstate', function(e) {
  return console.log('popstate');
});

window.addEventListener('hashchange', function(e) {
  return console.log('hashchangedddd');
});

describe("Kazitori", function() {
  beforeEach(function() {
    return router.change('/');
  });
  afterEach(function() {
    return router.change('/');
  });
  describe("property", function() {
    it("should started to be Truthy", function() {
      return expect(Kazitori.started).toBeTruthy();
    });
    it("test stop and restart", function() {
      router.stop();
      expect(Kazitori.started).toBeFalsy();
      return router.start();
    });
    xit("test getHash", function() {
      location.replace("" + location.origin + "/#posts");
      return expect(router.getHash()).toEqual('posts');
    });
    it("test getFragment", function() {
      router.change('/posts/1');
      return expect(router.getFragment()).toEqual('/posts/1');
    });
    return it("test isOldIE", function() {
      var msie;
      msie = navigator.appVersion.toLowerCase();
      msie = msie.indexOf('msie') > -1 ? parseInt(msie.replace(/.*msie[ ]/, '').match(/^[0-9]+/)) : 0;
      if (msie === 0) {
        return expect(router.isOldIE).toBeFalsy();
      } else if (msie <= 9) {
        return expect(router.isOldIE).toBeTruthy();
      }
    });
  });
  describe("event", function() {
    var nextHandler, notFoundHandler, prevHandler, startHandler, stopHandler;
    startHandler = jasmine.createSpy('START event');
    it("should dispatch start event when kazitori started", function() {
      router.addEventListener(KazitoriEvent.START, startHandler);
      router.stop();
      router.start();
      return expect(startHandler).toHaveBeenCalled();
    });
    it("should dispatch start event once", function() {
      return expect(startHandler.calls.length).toEqual(1);
    });
    it("should not call handler when START event listener removed", function() {
      router.removeEventListener(KazitoriEvent.START, startHandler);
      startHandler.reset();
      router.stop();
      router.start();
      return expect(startHandler).not.toHaveBeenCalled();
    });
    stopHandler = jasmine.createSpy('STOP event');
    it("should dispatch stop event when kazitori stoped", function() {
      router.addEventListener(KazitoriEvent.STOP, stopHandler);
      router.stop();
      return expect(stopHandler).toHaveBeenCalled();
    });
    it("should dispatch stop event once", function() {
      return expect(stopHandler.calls.length).toEqual(1);
    });
    it("should not call handler when STOP event listener removed", function() {
      router.removeEventListener(KazitoriEvent.STOP, stopHandler);
      stopHandler.reset();
      router.stop();
      expect(stopHandler).not.toHaveBeenCalled();
      return router.start();
    });
    xit("should dispatch change events when kazitori changed", function() {
      var listener, _next, _prev;
      _prev = "/posts";
      _next = "/posts/new";
      router.change("" + _prev);
      expect(window.location.pathname).toEqual("" + _prev);
      listener = {
        onChange: function(e) {
          console.log('onChange');
          expect(e.prev).toEqual("" + _prev);
          return expect(e.next).toEqual("" + _next);
        },
        onInternalChange: function(e) {
          console.log('onInternalChange');
          expect(e.prev).toEqual("" + _prev);
          return expect(e.next).toEqual("" + _next);
        },
        onUserChange: function(e) {
          console.log('onUserChange');
          expect(e.prev).toEqual("" + _prev);
          return expect(e.next).toEqual("" + _next);
        }
      };
      spyOn(listener, 'onChange').andCallThrough();
      spyOn(listener, 'onInternalChange').andCallThrough();
      spyOn(listener, 'onUserChange').andCallThrough();
      router.addEventListener(KazitoriEvent.CHANGE, listener.onChange);
      router.addEventListener(KazitoriEvent.INTERNAL_CHANGE, listener.onInternalChange);
      router.addEventListener(KazitoriEvent.USER_CHANGE, listener.onUserChange);
      router.change("" + _next);
      expect(listener.onChange).toHaveBeenCalled();
      expect(listener.onChange.calls.length).toEqual(1);
      expect(listener.onInternalChange).toHaveBeenCalled();
      expect(listener.onInternalChange.calls.length).toEqual(1);
      expect(listener.onUserChange).not.toHaveBeenCalled();
      listener.onChange.reset();
      listener.onInternalChange.reset();
      listener.onUserChange.reset();
      location.replace("" + location.origin + _prev);
      location.replace("" + location.origin + _next);
      expect(listener.onChange).toHaveBeenCalled();
      expect(listener.onChange.calls.length).toEqual(1);
      expect(listener.onInternalChange).not.toHaveBeenCalled();
      expect(listener.onUserChange).toHaveBeenCalled();
      expect(listener.onUserChange.calls.length).toEqual(1);
      router.removeEventListener(KazitoriEvent.CHANGE, listener.onChange);
      router.removeEventListener(KazitoriEvent.INTERNAL_CHANGE, listener.onChange);
      router.removeEventListener(KazitoriEvent.USER_CHANGE, listener.onChange);
      router.change("" + _next);
      location.replace("" + location.origin + _next);
      listener.onChange.reset();
      listener.onInternalChange.reset();
      listener.onUserChange.reset();
      expect(listener.onChange).not.toHaveBeenCalled();
      expect(listener.onInternalChange).not.toHaveBeenCalled();
      return expect(listener.onUserChange).not.toHaveBeenCalled();
    });
    prevHandler = jasmine.createSpy('PREV Event');
    it("should dispatch prev event when kazitori omokazied", function() {
      router.addEventListener(KazitoriEvent.PREV, prevHandler);
      router.omokazi();
      expect(prevHandler).toHaveBeenCalled();
      return expect(prevHandler.calls.length).toEqual(1);
    });
    it("should not call handler when PREV event listener removed", function() {
      router.removeEventListener(KazitoriEvent.PREV, prevHandler);
      prevHandler.reset();
      router.omokazi();
      expect(prevHandler).not.toHaveBeenCalled();
      return router.torikazi();
    });
    nextHandler = jasmine.createSpy('NEXT Event');
    it("should dispatch prev event when kazitori torikazied", function() {
      router.addEventListener(KazitoriEvent.NEXT, nextHandler);
      router.torikazi();
      expect(nextHandler).toHaveBeenCalled();
      return expect(nextHandler.calls.length).toEqual(1);
    });
    it("should not call handler when NEXT event listener removed", function() {
      router.removeEventListener(KazitoriEvent.NEXT, nextHandler);
      nextHandler.reset();
      router.torikazi();
      return expect(nextHandler).not.toHaveBeenCalled();
    });
    notFoundHandler = jasmine.createSpy('NOT_FOUND Event');
    it("should dispatch not_found event when kazitori router undefined", function() {
      router.addEventListener(KazitoriEvent.NOT_FOUND, notFoundHandler);
      router.change("/hageeeeeee");
      expect(notFoundHandler).toHaveBeenCalled();
      return expect(notFoundHandler.calls.length).toEqual(1);
    });
    return it("should not call handler when NEXT event listener removed", function() {
      router.removeEventListener(KazitoriEvent.NOT_FOUND, notFoundHandler);
      notFoundHandler.reset();
      router.change("/hogeeeeeee");
      return expect(notFoundHandler).not.toHaveBeenCalled();
    });
  });
  xit("test routes (simple)", function() {
    location.replace("" + location.origin + "/posts/1");
    return expect(window.location.pathname).toEqual('/posts/1');
  });
  it("can be change location (simple)", function() {
    router.change('/posts/1');
    return expect(window.location.pathname).toEqual('/posts/1');
  });
  it("can be change location (two part)", function() {
    router.change('/users/3/posts/1');
    return expect(window.location.pathname).toEqual('/users/3/posts/1');
  });
  return describe("with controller", function() {
    it('index should be called', function() {
      spyOn(controller, 'index');
      router.change('/posts');
      return expect(controller.index).toHaveBeenCalled();
    });
    it('show should be called', function() {
      spyOn(controller, 'show');
      router.change('/posts/1');
      return expect(controller.show).toHaveBeenCalled();
    });
    it('show should be called with casted argments', function() {
      spyOn(controller, 'show');
      router.change('/posts/32941856');
      return expect(controller.show).toHaveBeenCalledWith(32941856);
    });
    it('befores should be before called', function() {
      spyOn(controller, 'beforeShow');
      router.change('/posts/1');
      return expect(controller.beforeShow).toHaveBeenCalled();
    });
    it('show should be called with casted argments', function() {
      spyOn(controller, 'beforeShow');
      router.change('/posts/32941856');
      return expect(controller.beforeShow).toHaveBeenCalledWith(32941856);
    });
    return it('beforeAny should be before called', function() {
      spyOn(controller, 'beforeAny');
      router.change('/posts');
      expect(controller.beforeAny).toHaveBeenCalled();
      router.change('/posts/1');
      return expect(controller.beforeAny).toHaveBeenCalled();
    });
  });
});

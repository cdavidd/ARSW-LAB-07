var app = (function() {
  class Point {
    constructor(x, y) {
      this.x = x;
      this.y = y;
    }
  }

  var idDibujo;
  var stompClient = null;

  var addPointToCanvas = function(point) {
    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.arc(point.x, point.y, 1, 0, 2 * Math.PI);
    ctx.stroke();
  };

  var getMousePosition = function(evt) {
    canvas = document.getElementById("canvas");
    var rect = canvas.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top
    };
  };

  var connectAndSubscribe = function(callback) {
    console.info("Connecting to WS...");
    var socket = new SockJS("/stompendpoint");
    stompClient = Stomp.over(socket);

    //subscribe to /topic/TOPICXX when connections succeed
    stompClient.connect({}, function(frame) {
      console.log("Connected: " + frame);
      //stompClient.subscribe("/topic/TOPICXX", function(eventbody) {});
      stompClient.subscribe("/topic/newpoint." + idDibujo, function(eventbody) {
        var theObject = JSON.parse(eventbody.body);
        //callback("New Point: " + theObject.x + " " + theObject.y);
        callback(new Point(theObject.x, theObject.y));
      });
    });
  };

  return {
    init: function() {
      app.disconnect();

      idDibujo = $("#dibujo").val();
      console.log(idDibujo);
      if (idDibujo) {
        var can = document.getElementById("canvas");
        can.addEventListener("pointerdown", function(evt) {
          var clickPosition = getMousePosition(evt);
          app.publishPoint(clickPosition.x, clickPosition.y);
        });
        //websocket connection
        connectAndSubscribe(addPointToCanvas);
      }
    },

    publishPoint: function(px, py) {
      if (idDibujo) {
        var pt = new Point(px, py);
        console.info("publishing point at " + pt);
        //addPointToCanvas(pt);
        //publicar el evento
        stompClient.send("/topic/newpoint." + idDibujo, {}, JSON.stringify(pt));
      }
    },

    disconnect: function() {
      if (stompClient !== null) {
        stompClient.disconnect();
      }
      //setConnected(false);
      console.log("Disconnected");
    }
  };
})();

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

  var addPolygonToCanvas = function (points) {
    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    var cont = 1;
    ctx.fillStyle = '#f00';
    ctx.beginPath();
    ctx.moveTo(points[0].x,points[0].y);
    points.filter((point,index) => {return index > 0}).map(function (point) {
      if (cont == 4){
        cont = 0;
        ctx.moveTo(point.x,point.y);
      }else{
        ctx.lineTo(point.x, point.y);
      }
      cont++;
      ctx.stroke();
    });
    ctx.closePath();
    ctx.fill();
  };

  var getMousePosition = function(evt) {
    canvas = document.getElementById("canvas");
    var rect = canvas.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top
    };
  };
  var _clearCanvas = function() {
    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    return ctx;
  };
  var connectAndSubscribe = function() {
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
        addPointToCanvas(new Point(theObject.x, theObject.y));
      });

      stompClient.subscribe("/topic/newpolygon." + idDibujo, function(
          eventbody
      ) {
        var theObject = JSON.parse(eventbody.body);
        addPolygonToCanvas(theObject);
      });
    });
  };

  return {
    init: function() {
      app.disconnect();
      _clearCanvas();
      idDibujo = $("#dibujo").val();
      console.log(idDibujo);
      if (idDibujo) {
        //websocket connection
        connectAndSubscribe();
      }
    },
    mouseEvent: function() {
      var can = document.getElementById("canvas");
      can.addEventListener("pointerdown", function(evt) {
        var clickPosition = getMousePosition(evt);
        app.publishPoint(clickPosition.x, clickPosition.y);
      });
    },
    publishPoint: function(px, py) {
      if (idDibujo) {
        var pt = new Point(px, py);
        console.info("publishing point at " + pt);
        //addPointToCanvas(pt);
        //publicar el evento
        stompClient.send("/app/newpoint." + idDibujo, {}, JSON.stringify(pt));
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

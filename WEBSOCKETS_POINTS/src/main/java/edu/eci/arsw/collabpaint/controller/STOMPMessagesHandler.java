package edu.eci.arsw.collabpaint.controller;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import edu.eci.arsw.collabpaint.model.Point;

@Controller
public class STOMPMessagesHandler {

    @Autowired
    SimpMessagingTemplate msgt;

    final ConcurrentHashMap<String, List<Point>> puntos = new ConcurrentHashMap<>();

    @MessageMapping("/newpoint.{numdibujo}")
    public void handlePointEvent(Point pt, @DestinationVariable String numdibujo) throws Exception {
        System.out.println("Nuevo punto recibido en el servidor!:" + pt + " idDibujo: " + numdibujo);
        if (puntos.containsKey(numdibujo)) {
            puntos.get(numdibujo).add(pt);
        } else {
            List<Point> temp = new ArrayList<Point>();
            puntos.put(numdibujo, temp);
            puntos.get(numdibujo).add(pt);
        }
        msgt.convertAndSend("/topic/newpoint." + numdibujo, pt);

        if (puntos.get(numdibujo).size() % 4 == 0) {
            msgt.convertAndSend("/topic/newpolygon." + numdibujo, puntos.get(numdibujo));
        }
    }
}
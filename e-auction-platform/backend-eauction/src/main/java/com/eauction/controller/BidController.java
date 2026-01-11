package com.eauction.controller;

import com.eauction.service.BidService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.security.Principal;

@RestController
@RequestMapping("/api/bid")
public class BidController {

    @Autowired
    BidService bidService;

    @PostMapping("/{id}")
    public ResponseEntity<?> bid(@PathVariable long id,
            @RequestBody Map<String, Object> body,
            Principal principal) {
        double amount = Double.parseDouble(String.valueOf(body.get("amount")));
        String result = bidService.placeBid(id, amount, principal.getName());
        if (result.startsWith("Bid Failed")) {
            return ResponseEntity.badRequest().body(Map.of("message", result));
        }
        return ResponseEntity.ok(Map.of("message", result));
    }
}

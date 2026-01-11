package com.eauction.controller;

import com.eauction.model.Notification;
import com.eauction.model.User;
import com.eauction.repository.NotificationRepository;
import com.eauction.repository.UserRepository;
import java.security.Principal;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    @Autowired
    private NotificationRepository notificationRepository;
    @Autowired
    private UserRepository userRepository;

    @GetMapping("/my")
    public List<Notification> my(Principal principal) {
        User user = userRepository.findByUsername(principal.getName());
        return notificationRepository.findByUser_IdOrderByCreatedAtDesc(user.getId());
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> mark(@PathVariable long id, @RequestBody Map<String, Boolean> body, Principal principal) {
        User user = userRepository.findByUsername(principal.getName());
        return notificationRepository.findById(id).map(n -> {
            if (n.getUser() != null && !n.getUser().getId().equals(user.getId())) {
                return ResponseEntity.status(403).body(Map.of("message", "forbidden"));
            }
            Boolean read = body.get("read");
            n.setRead(read != null ? read : n.isRead());
            notificationRepository.save(n);
            return ResponseEntity.ok(Map.of("message", "updated"));
        }).orElse(ResponseEntity.notFound().build());
    }
}

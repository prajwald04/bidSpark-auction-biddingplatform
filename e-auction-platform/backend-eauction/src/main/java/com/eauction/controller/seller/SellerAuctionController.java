package com.eauction.controller.seller;

import com.eauction.dto.AuctionCreateDto;
import com.eauction.dto.AuctionUpdateDto;
import com.eauction.model.Auction;
import com.eauction.model.User;
import com.eauction.repository.AuctionRepository;
import com.eauction.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/seller/auctions")
public class SellerAuctionController {
    @Autowired
    private AuctionRepository auctionRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private com.eauction.repository.NotificationRepository notificationRepository;
    @Autowired
    private org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

    @GetMapping("/my")
    public List<Auction> myAuctions(Principal principal) {
        User seller = userRepository.findByUsername(principal.getName());
        return auctionRepository.findBySeller_Id(seller.getId());
    }

    @PostMapping
    public ResponseEntity<Auction> create(@Valid @RequestBody AuctionCreateDto dto, Principal principal) {
        User seller = userRepository.findByUsername(principal.getName());
        Auction auction = new Auction();
        auction.setSeller(seller);
        auction.setProductName(dto.getProductName());
        auction.setCategory(dto.getCategory());
        auction.setDescription(dto.getDescription());
        auction.setCondition(dto.getCondition());
        auction.setStartingPrice(dto.getStartingPrice());
        auction.setMinIncrement(dto.getMinIncrement());
        auction.setBuyNowPrice(dto.getBuyNowPrice());
        auction.setStartTime(dto.getStartTime() != null ? dto.getStartTime() : LocalDateTime.now());
        auction.setEndTime(dto.getEndTime());
        auction.setAutoExtend(dto.getAutoExtend());
        auction.setImageUrl(dto.getImageUrl());
        auction.setImageUrls(dto.getImageUrls());
        auction.setEnabled(dto.getEnabled() != null ? dto.getEnabled() : true);
        if (auction.getStartingPrice() <= 0) {
            return ResponseEntity.badRequest().build();
        }
        if (auction.getMinIncrement() != null && auction.getMinIncrement() <= 0) {
            return ResponseEntity.badRequest().build();
        }
        if (auction.getBuyNowPrice() != null && auction.getBuyNowPrice() <= auction.getStartingPrice()) {
            return ResponseEntity.badRequest().build();
        }
        if (auction.getStartTime() != null && auction.getEndTime() != null
                && !auction.getStartTime().isBefore(auction.getEndTime())) {
            return ResponseEntity.badRequest().build();
        }
        if (auction.getCurrentBid() == null) {
            auction.setCurrentBid(auction.getStartingPrice());
        }
        if (auction.getBidCount() == null) {
            auction.setBidCount(0);
        }
        LocalDateTime now = LocalDateTime.now();
        String status;
        if (!auction.isEnabled()) {
            status = "DRAFT";
        } else if (auction.getEndTime() != null && now.isAfter(auction.getEndTime())) {
            status = "ENDED";
        } else if (auction.getStartTime() != null && now.isBefore(auction.getStartTime())) {
            status = "SCHEDULED";
        } else {
            status = "LIVE";
        }
        auction.setStatus(status);
        Auction saved = auctionRepository.save(auction);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable long id, @Valid @RequestBody AuctionUpdateDto dto,
            Principal principal) {
        return auctionRepository.findById(id).map(existing -> {
            LocalDateTime now = LocalDateTime.now();
            if (existing.getStartTime() != null && now.isAfter(existing.getStartTime())) {
                return ResponseEntity.badRequest().body(Map.of("message", "Auction already started"));
            }
            if (dto.getStartingPrice() != null && dto.getStartingPrice() <= 0) {
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid starting price"));
            }
            if (dto.getMinIncrement() != null && dto.getMinIncrement() <= 0) {
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid minimum increment"));
            }
            if (dto.getBuyNowPrice() != null && dto.getStartingPrice() != null
                    && dto.getBuyNowPrice() <= dto.getStartingPrice()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid buy now price"));
            }
            if (dto.getStartTime() != null && dto.getEndTime() != null
                    && !dto.getStartTime().isBefore(dto.getEndTime())) {
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid time range"));
            }
            if (dto.getProductName() != null)
                existing.setProductName(dto.getProductName());
            if (dto.getCategory() != null)
                existing.setCategory(dto.getCategory());
            if (dto.getDescription() != null)
                existing.setDescription(dto.getDescription());
            if (dto.getCondition() != null)
                existing.setCondition(dto.getCondition());
            if (dto.getStartingPrice() != null)
                existing.setStartingPrice(dto.getStartingPrice());
            if (dto.getMinIncrement() != null)
                existing.setMinIncrement(dto.getMinIncrement());
            if (dto.getBuyNowPrice() != null)
                existing.setBuyNowPrice(dto.getBuyNowPrice());
            if (dto.getStartTime() != null)
                existing.setStartTime(dto.getStartTime());
            if (dto.getEndTime() != null)
                existing.setEndTime(dto.getEndTime());
            if (dto.getEnabled() != null)
                existing.setEnabled(dto.getEnabled());
            if (dto.getAutoExtend() != null)
                existing.setAutoExtend(dto.getAutoExtend());
            if (dto.getImageUrl() != null)
                existing.setImageUrl(dto.getImageUrl());
            if (dto.getImageUrls() != null)
                existing.setImageUrls(dto.getImageUrls());
            String status;
            if (!existing.isEnabled()) {
                status = "DRAFT";
            } else if (existing.getEndTime() != null && now.isAfter(existing.getEndTime())) {
                status = "ENDED";
            } else if (existing.getStartTime() != null && now.isBefore(existing.getStartTime())) {
                status = "SCHEDULED";
            } else {
                status = "LIVE";
            }
            existing.setStatus(status);
            Auction saved = auctionRepository.save(existing);
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/declare-winner")
    public ResponseEntity<?> declareWinner(@PathVariable long id, Principal principal) {
        User seller = userRepository.findByUsername(principal.getName());
        return auctionRepository.findById(id).map(a -> {
            if (a.getSeller() == null || !a.getSeller().getId().equals(seller.getId())) {
                return ResponseEntity.status(403).body(Map.of("message", "forbidden"));
            }
            if (a.getHighestBidder() == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "no highest bidder"));
            }
            LocalDateTime now = LocalDateTime.now();
            a.setEnabled(false);
            a.setStatus("ENDED");
            if (a.getEndTime() == null || now.isBefore(a.getEndTime())) {
                a.setEndTime(now);
            }
            auctionRepository.save(a);
            java.util.Map<String, Object> update = new java.util.HashMap<>();
            update.put("auctionId", a.getId());
            update.put("currentBid", a.getCurrentBid());
            update.put("bidCount", a.getBidCount());
            update.put("endTime", a.getEndTime());
            update.put("status", "ENDED");
            update.put("highestBidderId", a.getHighestBidder().getId());
            messagingTemplate.convertAndSend("/topic/auction/" + a.getId(), update);
            java.util.Map<String, Object> winnerMsg = new java.util.HashMap<>();
            winnerMsg.put("message", "You won " + a.getProductName());
            winnerMsg.put("type", "success");
            messagingTemplate.convertAndSend("/user/" + a.getHighestBidder().getId() + "/notifications", winnerMsg);
            com.eauction.model.Notification nw = new com.eauction.model.Notification();
            nw.setUser(a.getHighestBidder());
            nw.setMessage("You won " + a.getProductName());
            nw.setType("success");
            nw.setCreatedAt(LocalDateTime.now());
            nw.setRead(false);
            notificationRepository.save(nw);
            java.util.Map<String, Object> sellerMsg = new java.util.HashMap<>();
            sellerMsg.put("message", "Winner declared for " + a.getProductName());
            sellerMsg.put("type", "info");
            messagingTemplate.convertAndSend("/user/" + seller.getId() + "/notifications", sellerMsg);
            com.eauction.model.Notification ns = new com.eauction.model.Notification();
            ns.setUser(seller);
            ns.setMessage("Winner declared for " + a.getProductName());
            ns.setType("info");
            ns.setCreatedAt(LocalDateTime.now());
            ns.setRead(false);
            notificationRepository.save(ns);
            return ResponseEntity.ok(Map.of("message", "winner declared"));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable long id, @RequestBody Map<String, Boolean> body) {
        return auctionRepository.findById(id).map(a -> {
            Boolean enabled = body.get("enabled");
            a.setEnabled(enabled != null ? enabled : a.isEnabled());
            auctionRepository.save(a);
            return ResponseEntity.ok(Map.of("message", "updated"));
        }).orElse(ResponseEntity.notFound().build());
    }
}

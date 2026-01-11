package com.eauction.controller;

import com.eauction.model.Auction;
import com.eauction.model.User;
import com.eauction.model.Watchlist;
import com.eauction.repository.AuctionRepository;
import com.eauction.repository.BidRepository;
import com.eauction.repository.UserRepository;
import com.eauction.repository.WatchlistRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auctions")
public class AuctionController {

    @Autowired
    private AuctionRepository auctionRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private BidRepository bidRepository;
    @Autowired
    private WatchlistRepository watchlistRepository;

    @GetMapping
    public List<Auction> all() {
        return auctionRepository.findAll();
    }

    @GetMapping("/live")
    public List<Auction> live() {
        return auctionRepository.findLiveAuctions();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Auction> get(@PathVariable long id) {
        return auctionRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/bids")
    public List<com.eauction.model.Bid> bids(@PathVariable long id) {
        return bidRepository.findByAuction_IdOrderByBidTimeDesc(id);
    }

    @GetMapping("/my")
    public List<Auction> myAuctions(Principal principal) {
        User seller = userRepository.findByUsername(principal.getName());
        return auctionRepository.findBySeller_Id(seller.getId());
    }

    @GetMapping("/my-bids")
    public List<Auction> myBids(Principal principal) {
        User bidder = userRepository.findByUsername(principal.getName());
        return auctionRepository.findAuctionsByBidderId(bidder.getId());
    }

    @PostMapping
    public ResponseEntity<Auction> create(@RequestBody Auction auction, Principal principal) {
        User seller = userRepository.findByUsername(principal.getName());
        auction.setSeller(seller);
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
        if (auction.getStartTime() == null) {
            auction.setStartTime(LocalDateTime.now());
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
    public ResponseEntity<?> update(@PathVariable long id, @RequestBody Auction incoming, Principal principal) {
        return auctionRepository.findById(id).map(existing -> {
            LocalDateTime now = LocalDateTime.now();
            if (existing.getStartTime() != null && now.isAfter(existing.getStartTime())) {
                return ResponseEntity.badRequest().body(Map.of("message", "Auction already started"));
            }
            if (incoming.getStartingPrice() <= 0) {
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid starting price"));
            }
            if (incoming.getMinIncrement() != null && incoming.getMinIncrement() <= 0) {
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid minimum increment"));
            }
            if (incoming.getBuyNowPrice() != null
                    && incoming.getBuyNowPrice() <= incoming.getStartingPrice()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid buy now price"));
            }
            if (incoming.getStartTime() != null && incoming.getEndTime() != null
                    && !incoming.getStartTime().isBefore(incoming.getEndTime())) {
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid time range"));
            }
            existing.setProductName(incoming.getProductName());
            existing.setCategory(incoming.getCategory());
            existing.setDescription(incoming.getDescription());
            existing.setCondition(incoming.getCondition());
            existing.setStartingPrice(incoming.getStartingPrice());
            existing.setMinIncrement(incoming.getMinIncrement());
            existing.setBuyNowPrice(incoming.getBuyNowPrice());
            existing.setStartTime(incoming.getStartTime());
            existing.setEndTime(incoming.getEndTime());
            existing.setEnabled(incoming.isEnabled());
            existing.setAutoExtend(incoming.getAutoExtend());
            existing.setImageUrl(incoming.getImageUrl());
            existing.setImageUrls(incoming.getImageUrls());
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

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable long id, @RequestBody Map<String, Boolean> body) {
        return auctionRepository.findById(id).map(a -> {
            Boolean enabled = body.get("enabled");
            a.setEnabled(enabled != null ? enabled : a.isEnabled());
            auctionRepository.save(a);
            return ResponseEntity.ok(Map.of("message", "updated"));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/watch")
    public ResponseEntity<?> toggleWatch(@PathVariable long id, Principal principal) {
        User user = userRepository.findByUsername(principal.getName());
        Watchlist wl = watchlistRepository.findByUser_IdAndAuction_Id(user.getId(), id);
        if (wl == null) {
            Auction a = auctionRepository.findById(id).orElseThrow();
            Watchlist n = new Watchlist();
            n.setUser(user);
            n.setAuction(a);
            watchlistRepository.save(n);
            return ResponseEntity.ok(Map.of("watched", true));
        } else {
            watchlistRepository.delete(wl);
            return ResponseEntity.ok(Map.of("watched", false));
        }
    }
}

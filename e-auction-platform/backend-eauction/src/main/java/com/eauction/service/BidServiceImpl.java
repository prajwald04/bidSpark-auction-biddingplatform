package com.eauction.service;

import com.eauction.model.Auction;
import com.eauction.model.Bid;
import com.eauction.model.User;
import com.eauction.repository.AuctionRepository;
import com.eauction.repository.BidRepository;
import com.eauction.repository.UserRepository;
import com.eauction.repository.NotificationRepository;
import com.eauction.model.Notification;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Service
public class BidServiceImpl implements BidService {

    @Autowired
    AuctionRepository auctionRepo;
    @Autowired
    BidRepository bidRepo;
    @Autowired
    UserRepository userRepo;
    @Autowired
    SimpMessagingTemplate messagingTemplate;
    @Autowired
    NotificationRepository notificationRepository;

    public String placeBid(long auctionId, double amount, String username) {
        Auction auction = auctionRepo.findById(auctionId).orElseThrow();
        if (LocalDateTime.now().isAfter(auction.getEndTime())) {
            User bidder = userRepo.findByUsername(username);
            Map<String, Object> notifFail = new HashMap<>();
            notifFail.put("message", "Bid failed – auction ended");
            notifFail.put("type", "error");
            messagingTemplate.convertAndSend("/user/" + bidder.getId() + "/notifications", notifFail);
            Notification nf = new Notification();
            nf.setUser(bidder);
            nf.setMessage("Bid failed – auction ended");
            nf.setType("error");
            nf.setCreatedAt(LocalDateTime.now());
            nf.setRead(false);
            notificationRepository.save(nf);
            return "Bid Failed: Auction Ended";
        }
        if (auction.getCurrentBid() != null) {
            double minInc = auction.getMinIncrement() != null ? auction.getMinIncrement() : 1.0;
            if (amount < auction.getCurrentBid() + minInc) {
                User bidder = userRepo.findByUsername(username);
                Map<String, Object> notifFail2 = new HashMap<>();
                notifFail2.put("message", "Bid failed – minimum increment is $" + minInc);
                notifFail2.put("type", "error");
                messagingTemplate.convertAndSend("/user/" + bidder.getId() + "/notifications", notifFail2);
                Notification nf2 = new Notification();
                nf2.setUser(bidder);
                nf2.setMessage("Bid failed – minimum increment is $" + minInc);
                nf2.setType("error");
                nf2.setCreatedAt(LocalDateTime.now());
                nf2.setRead(false);
                notificationRepository.save(nf2);
                return "Bid Failed: Higher bid exists";
            }
        }

        Bid bid = new Bid();
        bid.setAmount(amount);
        bid.setBidTime(LocalDateTime.now());
        bid.setAuction(auction);
        User bidder = userRepo.findByUsername(username);
        bid.setBidder(bidder);

        bidRepo.save(bid);
        User prevHighest = auction.getHighestBidder();
        auction.setCurrentBid(amount);
        auction.setBidCount(auction.getBidCount() == null ? 1 : auction.getBidCount() + 1);
        auction.setHighestBidder(bidder);
        if (Boolean.TRUE.equals(auction.getAutoExtend())) {
            long secondsLeft = Duration.between(LocalDateTime.now(), auction.getEndTime()).getSeconds();
            if (secondsLeft > 0 && secondsLeft <= 60) {
                auction.setEndTime(auction.getEndTime().plusMinutes(2));
            }
        }
        auctionRepo.save(auction);

        Map<String, Object> update = new HashMap<>();
        update.put("auctionId", auctionId);
        update.put("currentBid", auction.getCurrentBid());
        update.put("bidCount", auction.getBidCount());
        update.put("bidTime", bid.getBidTime());
        update.put("endTime", auction.getEndTime());
        messagingTemplate.convertAndSend("/topic/auction/" + auctionId, update);

        Map<String, Object> notif = new HashMap<>();
        notif.put("message", "Bid placed successfully!");
        notif.put("type", "success");
        messagingTemplate.convertAndSend("/user/" + bidder.getId() + "/notifications", notif);
        Notification ns = new Notification();
        ns.setUser(bidder);
        ns.setMessage("Bid placed successfully!");
        ns.setType("success");
        ns.setCreatedAt(LocalDateTime.now());
        ns.setRead(false);
        notificationRepository.save(ns);

        if (prevHighest != null && !prevHighest.getId().equals(bidder.getId())) {
            Map<String, Object> outbid = new HashMap<>();
            outbid.put("message", "You were outbid on " + auction.getProductName());
            outbid.put("type", "warning");
            messagingTemplate.convertAndSend("/user/" + prevHighest.getId() + "/notifications", outbid);
            Notification no = new Notification();
            no.setUser(prevHighest);
            no.setMessage("You were outbid on " + auction.getProductName());
            no.setType("warning");
            no.setCreatedAt(LocalDateTime.now());
            no.setRead(false);
            notificationRepository.save(no);
        }

        Map<String, Object> sellerNotif = new HashMap<>();
        sellerNotif.put("message", "New bid placed on your auction: " + auction.getProductName());
        sellerNotif.put("type", "info");
        messagingTemplate.convertAndSend("/user/" + auction.getSeller().getId() + "/notifications", sellerNotif);
        Notification sl = new Notification();
        sl.setUser(auction.getSeller());
        sl.setMessage("New bid placed on your auction: " + auction.getProductName());
        sl.setType("info");
        sl.setCreatedAt(LocalDateTime.now());
        sl.setRead(false);
        notificationRepository.save(sl);

        return "Bid Success";
    }
}

package com.eauction.repository;

import com.eauction.model.Auction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface AuctionRepository extends JpaRepository<Auction, Long> {
    @Query("select a from Auction a where a.enabled = true and a.startTime <= CURRENT_TIMESTAMP and a.endTime >= CURRENT_TIMESTAMP")
    java.util.List<Auction> findLiveAuctions();

    java.util.List<Auction> findBySeller_Id(Long sellerId);

    @Query("select distinct b.auction from Bid b where b.bidder.id = ?1")
    java.util.List<Auction> findAuctionsByBidderId(Long bidderId);
}

package com.eauction.repository;

import com.eauction.model.Bid;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BidRepository extends JpaRepository<Bid, Long> {
    java.util.List<Bid> findByAuction_IdOrderByBidTimeDesc(Long auctionId);
}

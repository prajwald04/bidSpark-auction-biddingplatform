package com.eauction.repository;

import com.eauction.model.Watchlist;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WatchlistRepository extends JpaRepository<Watchlist, Long> {
    List<Watchlist> findByUser_Id(Long userId);
    Watchlist findByUser_IdAndAuction_Id(Long userId, Long auctionId);
}

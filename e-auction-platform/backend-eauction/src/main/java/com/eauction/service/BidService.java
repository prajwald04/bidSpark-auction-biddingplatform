package com.eauction.service;

public interface BidService {
    String placeBid(long auctionId, double amount, String username);
}
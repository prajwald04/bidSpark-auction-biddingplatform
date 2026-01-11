package com.eauction.controller;

import com.eauction.model.Auction;
import com.eauction.model.Watchlist;
import com.eauction.repository.WatchlistRepository;
import com.eauction.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/watchlist")
public class WatchlistController {
    @Autowired
    private WatchlistRepository watchlistRepository;
    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public List<Auction> list(Principal principal) {
        var user = userRepository.findByUsername(principal.getName());
        List<Watchlist> w = watchlistRepository.findByUser_Id(user.getId());
        return w.stream().map(Watchlist::getAuction).collect(Collectors.toList());
    }
}

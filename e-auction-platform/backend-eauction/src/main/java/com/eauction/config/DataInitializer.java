package com.eauction.config;

import com.eauction.model.Auction;
import com.eauction.model.User;
import com.eauction.repository.AuctionRepository;
import com.eauction.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;

@Configuration
public class DataInitializer {

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    CommandLineRunner init(UserRepository users, AuctionRepository auctions, PasswordEncoder encoder) {
        return args -> {
            if (users.findAll().isEmpty()) {
                User admin = new User();
                admin.setUsername("admin");
                admin.setPassword(encoder.encode("admin123"));
                admin.setRole("ADMIN");
                admin.setEnabled(true);
                users.save(admin);

                User seller = new User();
                seller.setUsername("seller");
                seller.setPassword(encoder.encode("seller123"));
                seller.setRole("SELLER");
                seller.setEnabled(true);
                users.save(seller);

                User bidder = new User();
                bidder.setUsername("bidder");
                bidder.setPassword(encoder.encode("bidder123"));
                bidder.setRole("BIDDER");
                bidder.setEnabled(true);
                users.save(bidder);

                Auction a1 = new Auction();
                a1.setProductName("iPhone 15 Pro");
                a1.setStartingPrice(900);
                a1.setStartTime(LocalDateTime.now().minusMinutes(5));
                a1.setEndTime(LocalDateTime.now().plusHours(1));
                a1.setEnabled(true);
                a1.setCurrentBid(a1.getStartingPrice());
                a1.setBidCount(0);
                a1.setSeller(seller);
                a1.setImageUrl(
                        "https://images.unsplash.com/photo-1670273009330-345e7396b97c?q=80&w=1600&auto=format&fit=crop");
                a1.setMinIncrement(10.0);
                auctions.save(a1);

                Auction a2 = new Auction();
                a2.setProductName("Gaming Laptop RTX 4080");
                a2.setStartingPrice(1800);
                a2.setStartTime(LocalDateTime.now().minusMinutes(10));
                a2.setEndTime(LocalDateTime.now().plusHours(2));
                a2.setEnabled(true);
                a2.setCurrentBid(a2.getStartingPrice());
                a2.setBidCount(0);
                a2.setSeller(seller);
                a2.setImageUrl(
                        "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=1600&auto=format&fit=crop");
                a2.setMinIncrement(25.0);
                auctions.save(a2);
            }
        };
    }
}

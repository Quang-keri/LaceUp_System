package org.sport.backend.controller;

import org.sport.backend.entity.ItemGroup;
import org.sport.backend.repository.ItemGroupRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/item-groups")
public class ItemGroupController {

    @Autowired
    private ItemGroupRepository itemGroupRepo;

    @GetMapping
    public List<ItemGroup> getAll() {
        return itemGroupRepo.findAll();
    }
}
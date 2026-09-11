package com.amigos.backend.node;

import com.amigos.backend.node.dto.CreateNodeRequest;
import com.amigos.backend.node.dto.NodeResponse;
import com.amigos.backend.security.RoleConstants;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/nodes")
public class NodeController {

    private final NodeService nodeService;

    public NodeController(NodeService nodeService) {
        this.nodeService = nodeService;
    }

    @PostMapping
    @PreAuthorize("hasAuthority('" + RoleConstants.CITY_ADMIN + "')")
    public NodeResponse create(@Valid @RequestBody CreateNodeRequest request) {
        return nodeService.create(request);
    }

    @GetMapping
    @PreAuthorize("hasAuthority('" + RoleConstants.CITY_ADMIN + "')")
    public List<NodeResponse> list() {
        return nodeService.listAll();
    }
}

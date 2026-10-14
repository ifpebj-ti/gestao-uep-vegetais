package com.gestao.uep.services;

import com.gestao.uep.domain.cultivo.ModeloCultivo;
import com.gestao.uep.domain.cultivo.ModeloCultivoRepository;
import com.gestao.uep.domain.cultivo.dto.AtualizarModeloCultivoDTO;
import com.gestao.uep.domain.cultivo.dto.ModeloCultivoDTO;
import com.gestao.uep.domain.usuario.Usuario;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class ModeloCultivoService {

    private final ModeloCultivoRepository repository;
    private final CanteiroAuthorizationService authorizationService;

    public ModeloCultivoService(
            ModeloCultivoRepository repository,
            CanteiroAuthorizationService authorizationService
    ) {
        this.repository = repository;
        this.authorizationService = authorizationService;
    }

    @Transactional(readOnly = true)
    public List<ModeloCultivoDTO> listarAtivos() {
        return repository.findAllByAtivoTrueOrderByCulturaAscVariedadeAsc()
                .stream().map(ModeloCultivoDTO::from).toList();
    }

    @Transactional
    public ModeloCultivoDTO criar(AtualizarModeloCultivoDTO dados, Usuario usuario) {
        authorizationService.exigirProfessor(usuario);
        ModeloCultivo modelo = new ModeloCultivo();
        preencher(modelo, dados, usuario);
        return ModeloCultivoDTO.from(repository.save(modelo));
    }

    @Transactional
    public ModeloCultivoDTO atualizar(UUID id, AtualizarModeloCultivoDTO dados, Usuario usuario) {
        authorizationService.exigirProfessor(usuario);
        ModeloCultivo modelo = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Modelo de cultivo nao encontrado"));
        preencher(modelo, dados, usuario);
        return ModeloCultivoDTO.from(repository.save(modelo));
    }

    private void preencher(ModeloCultivo modelo, AtualizarModeloCultivoDTO dados, Usuario usuario) {
        modelo.setCultura(dados.cultura().trim());
        modelo.setVariedade(dados.variedade() == null ? null : dados.variedade().trim());
        modelo.setEspacamentoLinhasM(dados.espacamentoLinhasM());
        modelo.setEspacamentoPlantasM(dados.espacamentoPlantasM());
        modelo.setProdutividadeKgPorPlanta(dados.produtividadeKgPorPlanta());
        modelo.setPesoMedioKgPorUnidade(dados.pesoMedioKgPorUnidade());
        modelo.setPesoMedioKgPorPlanta(dados.pesoMedioKgPorPlanta());
        modelo.setUnidadeProducao(dados.unidadeProducao());
        modelo.setFatorAproveitamento(dados.fatorAproveitamento());
        modelo.setAtivo(dados.ativo() == null || dados.ativo());
        modelo.setAtualizadoPor(usuario);
    }
}

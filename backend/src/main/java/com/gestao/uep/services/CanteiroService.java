package com.gestao.uep.services;

import com.gestao.uep.domain.canteiro.Canteiro;
import com.gestao.uep.domain.canteiro.CanteiroRepository;
import com.gestao.uep.domain.canteiro.CanteiroResponsavel;
import com.gestao.uep.domain.canteiro.CanteiroResponsavelRepository;
import com.gestao.uep.domain.canteiro.FichaCampo;
import com.gestao.uep.domain.canteiro.FichaCampoRepository;
import com.gestao.uep.domain.canteiro.dto.AlunoResumoDTO;
import com.gestao.uep.domain.canteiro.dto.AtualizarFichaCampoDTO;
import com.gestao.uep.domain.canteiro.dto.CanteiroDetalheDTO;
import com.gestao.uep.domain.canteiro.dto.CanteiroResumoDTO;
import com.gestao.uep.domain.canteiro.dto.FichaCampoDTO;
import com.gestao.uep.domain.canteiro.dto.ResponsaveisDTO;
import com.gestao.uep.domain.usuario.Usuario;
import com.gestao.uep.domain.usuario.UsuarioRepository;
import com.gestao.uep.domain.usuario.UsuarioRole;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
public class CanteiroService {

    private final CanteiroRepository canteiroRepository;
    private final CanteiroResponsavelRepository responsavelRepository;
    private final FichaCampoRepository fichaRepository;
    private final UsuarioRepository usuarioRepository;
    private final CanteiroAuthorizationService authorizationService;
    private final PrevisaoColheitaService previsaoColheitaService;

    public CanteiroService(
            CanteiroRepository canteiroRepository,
            CanteiroResponsavelRepository responsavelRepository,
            FichaCampoRepository fichaRepository,
            UsuarioRepository usuarioRepository,
            CanteiroAuthorizationService authorizationService,
            PrevisaoColheitaService previsaoColheitaService
    ) {
        this.canteiroRepository = canteiroRepository;
        this.responsavelRepository = responsavelRepository;
        this.fichaRepository = fichaRepository;
        this.usuarioRepository = usuarioRepository;
        this.authorizationService = authorizationService;
        this.previsaoColheitaService = previsaoColheitaService;
    }

    @Transactional(readOnly = true)
    public List<CanteiroResumoDTO> listar(Usuario usuario) {
        List<Canteiro> canteiros;
        if (authorizationService.eProfessor(usuario)) {
            canteiros = canteiroRepository.findAllByOrderByCodigoAsc();
        } else if (usuario != null && usuario.getRole() == UsuarioRole.ALUNO) {
            canteiros = canteiroRepository.findAllById(
                    responsavelRepository.findCanteiroIdsByUsuarioId(usuario.getId())
            );
            canteiros.sort(Comparator.comparing(Canteiro::getCodigo));
        } else {
            return List.of();
        }
        return canteiros.stream().map(CanteiroResumoDTO::from).toList();
    }

    @Transactional(readOnly = true)
    public CanteiroDetalheDTO buscarDetalhe(String id, Usuario usuario) {
        Canteiro canteiro = buscar(id);
        authorizationService.exigirLeitura(id, usuario);
        return CanteiroDetalheDTO.from(
                canteiro,
                responsaveis(id).stream().map(AlunoResumoDTO::from).toList(),
                fichaAtual(canteiro),
                authorizationService.podeEditar(id, usuario)
        );
    }

    @Transactional(readOnly = true)
    public FichaCampoDTO buscarFicha(String id, Usuario usuario) {
        Canteiro canteiro = buscar(id);
        authorizationService.exigirLeitura(id, usuario);
        return fichaAtual(canteiro);
    }

    @Transactional
    public FichaCampoDTO atualizarFicha(String id, AtualizarFichaCampoDTO dados, Usuario usuario) {
        Canteiro canteiro = buscar(id);
        authorizationService.exigirEdicao(id, usuario);

        FichaCampo ficha = fichaRepository.findByCanteiroId(id)
                .orElseGet(() -> new FichaCampo(canteiro));
        ficha.setGrupo(dados.grupo());
        ficha.setCanteiroCodigo(valorOuPadrao(dados.canteiroCodigo(), canteiro.getCodigo()));
        ficha.setCultura(dados.cultura());
        ficha.setDataPlantio(dados.dataPlantio());
        ficha.setEspacamento(dados.espacamento());
        ficha.setPlantasPorCanteiro(dados.plantasPorCanteiro());
        ficha.setPrevisaoColheita(dados.previsaoColheita());
        ficha.setAdubacao(dados.adubacao());
        ficha.setControlePragas(dados.controlePragas());
        ficha.setLimpaCapina(dados.limpaCapina());
        ficha.setObs(dados.obs());
        ficha.setStatusEntrega(valorOuPadrao(dados.statusEntrega(), "pendente"));
        ficha.setDataEntrega(dados.dataEntrega());
        ficha.setVistoAssinado(Boolean.TRUE.equals(dados.vistoAssinado()));
        ficha.setDataVisto(dados.dataVisto());
        ficha.setParecer(dados.parecer());
        previsaoColheitaService.aplicar(ficha, dados, usuario);
        ficha.setUpdatedAt(Instant.now());
        ficha.setUpdatedBy(usuario);
        return FichaCampoDTO.from(fichaRepository.save(ficha));
    }

    @Transactional(readOnly = true)
    public List<Usuario> responsaveis(String id) {
        buscar(id);
        return responsavelRepository.findByCanteiroIdOrderByOrdem(id).stream()
                .map(CanteiroResponsavel::getUsuario)
                .toList();
    }

    @Transactional
    public List<Usuario> substituirResponsaveis(String id, ResponsaveisDTO dados, Usuario professor) {
        Canteiro canteiro = buscar(id);
        authorizationService.exigirProfessor(professor);

        List<UUID> alunoIds = dados == null || dados.alunoIds() == null
                ? List.of()
                : dados.alunoIds();
        if (alunoIds.size() > 3 || alunoIds.stream().distinct().count() != alunoIds.size()) {
            throw new IllegalArgumentException("Um canteiro deve possuir de zero a tres alunos sem duplicidade");
        }

        List<Usuario> alunos = new ArrayList<>();
        for (UUID alunoId : alunoIds) {
            Usuario aluno = usuarioRepository.findById(alunoId)
                    .orElseThrow(() -> new IllegalArgumentException("Aluno nao encontrado: " + alunoId));
            if (aluno.getRole() != UsuarioRole.ALUNO) {
                throw new IllegalArgumentException("Somente usuarios com papel ALUNO podem ser responsaveis");
            }
            alunos.add(aluno);
        }

        responsavelRepository.deleteByCanteiroId(id);
        // Garante que os vínculos antigos sejam removidos antes de inserir
        // novamente os responsáveis, respeitando a restrição única do banco.
        responsavelRepository.flush();
        for (short ordem = 1; ordem <= alunos.size(); ordem++) {
            responsavelRepository.save(new CanteiroResponsavel(canteiro, alunos.get(ordem - 1), ordem));
        }
        return alunos;
    }

    @Transactional(readOnly = true)
    public List<AlunoResumoDTO> listarAlunos(Usuario professor) {
        authorizationService.exigirProfessor(professor);
        return usuarioRepository.findAllByRoleOrderByNome(UsuarioRole.ALUNO).stream()
                .map(AlunoResumoDTO::from)
                .toList();
    }

    private Canteiro buscar(String id) {
        return canteiroRepository.findById(id).orElseThrow(() -> new CanteiroNotFoundException(id));
    }

    private FichaCampoDTO fichaAtual(Canteiro canteiro) {
        return fichaRepository.findByCanteiroId(canteiro.getId())
                .map(FichaCampoDTO::from)
                .orElseGet(() -> new FichaCampoDTO(
                        canteiro.getId(),
                        null,
                        canteiro.getCodigo(),
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        "pendente",
                        null,
                        false,
                        null,
                        null,
                        null,
                        null,
                        false,
                        null,
                        null,
                        null,
                        null
                ));
    }

    private String valorOuPadrao(String valor, String padrao) {
        return valor == null || valor.isBlank() ? padrao : valor;
    }
}

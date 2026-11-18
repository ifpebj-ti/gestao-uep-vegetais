package com.gestao.uep.services;

import com.gestao.uep.domain.usuario.Usuario;
import com.gestao.uep.domain.usuario.UsuarioRepository;
import com.gestao.uep.domain.usuario.UsuarioRole;
import com.gestao.uep.domain.usuario.dto.DadosProfessorDTO;
import com.gestao.uep.domain.usuario.dto.ProfessorAdminDTO;
import com.gestao.uep.services.ConviteProfessorService.EnvioEmail;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.sql.SQLException;
import java.util.List;
import java.util.UUID;

@Service
public class ProfessorAdminService {

    private static final String SQLSTATE_UNIQUE_VIOLATION = "23505";

    private final UsuarioRepository usuarios;
    private final ConviteProfessorService convites;
    private final EmailInstitucionalService emailInstitucional;
    private final PasswordEncoder passwordEncoder;

    public ProfessorAdminService(
            UsuarioRepository usuarios,
            ConviteProfessorService convites,
            EmailInstitucionalService emailInstitucional,
            PasswordEncoder passwordEncoder
    ) {
        this.usuarios = usuarios;
        this.convites = convites;
        this.emailInstitucional = emailInstitucional;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<ProfessorAdminDTO> listar() {
        return usuarios.findAllByRoleOrderByNome(UsuarioRole.PROFESSOR).stream()
                .map(usuario -> paraDto(usuario, convites.convitePendente(usuario)))
                .toList();
    }

    @Transactional
    public ResultadoAlteracao criar(DadosProfessorDTO dados) {
        String email = validarEmail(dados.email());
        verificarEmailDisponivel(email);

        Usuario usuario = new Usuario(
                dados.nome(), email, passwordEncoder.encode(UUID.randomUUID().toString()),
                UsuarioRole.PROFESSOR, false
        );
        usuario.alterarUep(dados.uep());
        usuario.desativar();
        salvarComEmail(usuario);

        EnvioEmail envio = convites.enviarConvite(usuario);
        return new ResultadoAlteracao(paraDto(usuario, true), envio);
    }

    @Transactional
    public ResultadoAlteracao atualizar(UUID id, DadosProfessorDTO dados) {
        Usuario usuario = buscarProfessorComBloqueio(id);
        String email = validarEmail(dados.email());
        boolean convitePendente = convites.convitePendente(usuario);

        usuario.alterarNome(dados.nome());
        usuario.alterarUep(dados.uep());
        if (usuario.getEmail().equals(email)) {
            return new ResultadoAlteracao(paraDto(usuario, convitePendente), null);
        }

        verificarEmailDisponivel(email);
        usuario.alterarEmail(email);
        salvarComEmail(usuario);

        EnvioEmail envio = convitePendente
                ? convites.enviarConvite(usuario)
                : convites.enviarConfirmacaoDeNovoEmail(usuario);
        return new ResultadoAlteracao(paraDto(usuario, convitePendente), envio);
    }

    @Transactional
    public ResultadoAlteracao reenviarConvite(UUID id) {
        Usuario usuario = buscarProfessorComBloqueio(id);
        if (!convites.convitePendente(usuario)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "O professor não tem convite pendente");
        }

        EnvioEmail envio = convites.enviarConvite(usuario);
        return new ResultadoAlteracao(paraDto(usuario, true), envio);
    }

    @Transactional
    public ProfessorAdminDTO alterarStatus(UUID id, boolean ativo) {
        Usuario usuario = buscarProfessorComBloqueio(id);
        if (convites.convitePendente(usuario)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "O professor precisa aceitar o convite primeiro");
        }

        if (ativo) {
            usuario.ativar();
        } else {
            usuario.desativar();
        }
        return paraDto(usuario, false);
    }

    private Usuario buscarProfessorComBloqueio(UUID id) {
        Usuario usuario = usuarios.findByIdForUpdate(id);
        if (usuario == null || usuario.getRole() != UsuarioRole.PROFESSOR) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Professor não encontrado");
        }
        return usuario;
    }

    private String validarEmail(String email) {
        String normalizado = emailInstitucional.normalizar(email);
        if (!emailInstitucional.aceitaEmailDocenteAdministrativo(normalizado)) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "Use um e-mail institucional docente do IFPE");
        }
        return normalizado;
    }

    private void verificarEmailDisponivel(String email) {
        if (usuarios.findByEmail(email) != null) {
            throw emailJaCadastrado();
        }
    }

    private void salvarComEmail(Usuario usuario) {
        try {
            usuarios.saveAndFlush(usuario);
        } catch (DataIntegrityViolationException exception) {
            // A restrição única resolve a corrida entre a consulta e a gravação do e-mail.
            if (exception.getMostSpecificCause() instanceof SQLException sqlException
                    && SQLSTATE_UNIQUE_VIOLATION.equals(sqlException.getSQLState())) {
                throw emailJaCadastrado();
            }
            throw exception;
        }
    }

    private static ResponseStatusException emailJaCadastrado() {
        return new ResponseStatusException(HttpStatus.CONFLICT, "E-mail já cadastrado");
    }

    private static ProfessorAdminDTO paraDto(Usuario usuario, boolean convitePendente) {
        return new ProfessorAdminDTO(
                usuario.getId(), usuario.getNome(), usuario.getEmail(), usuario.getUep(),
                usuario.getCriadoEm(), usuario.isAtivo(), usuario.isEmailVerificado(), convitePendente
        );
    }

    public record ResultadoAlteracao(ProfessorAdminDTO professor, EnvioEmail envio) {
    }
}

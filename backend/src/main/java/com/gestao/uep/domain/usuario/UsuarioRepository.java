package com.gestao.uep.domain.usuario;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.UUID;
import java.util.List;

/**
 * Repositório JPA para a entidade Usuario.
 * Oferece consulta por e-mail para integração com o Spring Security.
 */
public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {

    /**
     * Busca um usuário pelo e-mail para autenticação.
     *
     * @param email e-mail do usuário
     * @return UserDetails correspondente ou null se não encontrado
     */
    Usuario findByEmail(String email);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Usuario findByGoogleSubject(String googleSubject);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from Usuario u where u.email = :email")
    Usuario findByEmailForUpdate(@Param("email") String email);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from Usuario u where u.id = :id and u.email = :email")
    Usuario findByIdAndEmailForUpdate(@Param("id") UUID id, @Param("email") String email);

    List<Usuario> findAllByRoleOrderByNome(UsuarioRole role);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from Usuario u where u.id = :id")
    Usuario findByIdForUpdate(@Param("id") UUID id);
}

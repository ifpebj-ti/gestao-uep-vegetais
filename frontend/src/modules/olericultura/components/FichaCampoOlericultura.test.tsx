import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  calcularPlantasDoCanteiro,
  formatarEspacamento,
  normalizarEspacamento,
  FichaCampoOlericultura,
} from './FichaCampoOlericultura';
import { ModeloCultivoApi } from '../../../services/canteiroService';
import { CANTEIROS_DATA } from '../data/horticulturaData';

const modeloBase: ModeloCultivoApi = {
  id: 'modelo-1',
  cultura: 'Alface',
  variedade: null,
  espacamentoLinhasM: 0.3,
  espacamentoPlantasM: 0.3,
  produtividadeKgPorPlanta: null,
  pesoMedioKgPorUnidade: 0.25,
  pesoMedioKgPorPlanta: 0.25,
  unidadeProducao: 'UNIDADE',
  fatorAproveitamento: 0.8,
  ativo: true,
};

describe('calcularPlantasDoCanteiro', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('considera o canteiro com 1 m de largura e usa o comprimento derivado da área', () => {
    expect(calcularPlantasDoCanteiro(7.2, modeloBase)).toBe(72);
  });

  it('arredonda para baixo cada dimensão para respeitar o espaçamento', () => {
    const modelo = { ...modeloBase, espacamentoLinhasM: 0.4, espacamentoPlantasM: 0.3 };
    expect(calcularPlantasDoCanteiro(1, modelo)).toBe(6);
  });

  it('não calcula plantas quando o comprimento não foi informado', () => {
    expect(calcularPlantasDoCanteiro(null, modeloBase)).toBeNull();
  });

  it('exibe o espaçamento com casas necessárias e vírgula decimal', () => {
    expect(formatarEspacamento(1, 0.7)).toBe('1 m x 0,7 m');
    expect(normalizarEspacamento('1.0000 m x 0.7000 m')).toBe('1 m x 0,7 m');
  });

  it('sincroniza a cultura e o nome cientifico ao selecionar outro modelo', () => {
    const modeloBatata: ModeloCultivoApi = {
      ...modeloBase,
      id: 'modelo-batata',
      cultura: 'Batata',
      variedade: 'Solanum tuberosum L.',
    };

    render(
      <FichaCampoOlericultura
        canteiro={CANTEIROS_DATA[0]}
        podeEditar
        modelosCultivo={[modeloBatata]}
        onSalvar={vi.fn()}
      />
    );

    fireEvent.change(screen.getByRole('combobox', { name: /modelo agron/i }), {
      target: { value: 'modelo-batata' },
    });

    expect(screen.getByDisplayValue('Batata')).toBeInTheDocument();
    expect(screen.getByText('(Solanum tuberosum L.)')).toBeInTheDocument();
  });

  it('exibe a colheita única do canteiro e permite editar o peso colhido', () => {
    render(
      <FichaCampoOlericultura
        canteiro={CANTEIROS_DATA[0]}
        podeEditar
        onSalvar={vi.fn()}
      />
    );

    expect(screen.getByText(/Colheita Realizada no Canteiro \(kg\):/i)).toBeInTheDocument();
    const btnEditarColheita = screen.getByRole('button', { name: /^Editar Colheita$/i });
    expect(btnEditarColheita).toBeInTheDocument();

    fireEvent.click(btnEditarColheita);

    const inputPeso = screen.getByPlaceholderText(/Ex: 24,5/i);
    fireEvent.change(inputPeso, { target: { value: '27,3' } });

    const btnSalvarColheita = screen.getByRole('button', { name: /salvar colheita/i });
    fireEvent.click(btnSalvarColheita);

    expect(screen.getAllByText(/27,3 kg/i).length).toBeGreaterThan(0);
  });
});

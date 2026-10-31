import { Request, Response } from "express";
import { PlantaRepository } from "../repositories/PlantaRepository";
import { Luminosidade, Prisma } from "@prisma/client";
import { parseIdParam, MAX_INT } from "../utils/validators";

const plantaRepository = new PlantaRepository();

export class PlantaController {
  async create(req: Request, res: Response) {
    try {
      const body = req.body ?? {};
      const { nome, especie, preco, estoque, luminosidade, petFriendly, regaACadaDias } = body;

      if (
        typeof nome !== "string" || nome.trim() === "" ||
        typeof especie !== "string" || especie.trim() === "" ||
        !Number.isInteger(preco) || preco <= 0 || preco > MAX_INT ||
        !Number.isInteger(estoque) || estoque < 0 || estoque > MAX_INT ||
        !Object.values(Luminosidade).includes(luminosidade) ||
        typeof petFriendly !== "boolean" ||
        !Number.isInteger(regaACadaDias) || regaACadaDias <= 0 || regaACadaDias > MAX_INT
      ) {
        return res.status(400).json({ error: "Dados inválidos ou campos obrigatórios ausentes." });
      }

      const novaPlanta = await plantaRepository.create({
        nome,
        especie,
        preco,
        estoque,
        luminosidade,
        petFriendly,
        regaACadaDias,
      });

      return res.status(201).json(novaPlanta);
    } catch (error) {
      return res.status(500).json({ error: "Erro interno ao criar a planta." });
    }
  }

  async findAll(req: Request, res: Response) {
    try {
      const { petFriendly, luminosidade } = req.query;
      const filters: Prisma.PlantaWhereInput = {};

      if (petFriendly !== undefined) {
        if (petFriendly !== "true" && petFriendly !== "false") {
          return res.status(400).json({ error: "Filtro petFriendly inválido. Use 'true' ou 'false'." });
        }
        filters.petFriendly = petFriendly === "true";
      }

      if (luminosidade !== undefined) {
        if (!Object.values(Luminosidade).includes(luminosidade as Luminosidade)) {
          return res.status(400).json({ error: "Filtro luminosidade inválido." });
        }
        filters.luminosidade = luminosidade as Luminosidade;
      }

      const plantas = await plantaRepository.findAllFiltered(filters);
      return res.status(200).json(plantas);
    } catch (error) {
      return res.status(500).json({ error: "Erro interno ao listar as plantas." });
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const id = parseIdParam(req.params.id);
      if (!id) {
        return res.status(400).json({ error: "ID inválido ou excede o limite permitido." });
      }

      const planta = await plantaRepository.findById(id);
      if (!planta) {
        return res.status(404).json({ error: "Planta não encontrada." });
      }

      return res.status(200).json(planta);
    } catch (error) {
      return res.status(500).json({ error: "Erro interno ao buscar a planta." });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const id = parseIdParam(req.params.id);
      if (!id) {
        return res.status(400).json({ error: "ID inválido ou excede o limite permitido." });
      }

      const body = req.body ?? {};
      const { nome, especie, preco, estoque, luminosidade, petFriendly, regaACadaDias } = body;
      const dataToUpdate: Prisma.PlantaUpdateInput = {};

      if (nome !== undefined) {
        if (typeof nome !== "string" || nome.trim() === "") return res.status(400).json({ error: "Nome inválido." });
        dataToUpdate.nome = nome;
      }
      if (especie !== undefined) {
        if (typeof especie !== "string" || especie.trim() === "") return res.status(400).json({ error: "Espécie inválida." });
        dataToUpdate.especie = especie;
      }
      if (preco !== undefined) {
        if (!Number.isInteger(preco) || preco <= 0 || preco > MAX_INT) return res.status(400).json({ error: "Preço inválido." });
        dataToUpdate.preco = preco;
      }
      if (estoque !== undefined) {
        if (!Number.isInteger(estoque) || estoque < 0 || estoque > MAX_INT) return res.status(400).json({ error: "Estoque inválido." });
        dataToUpdate.estoque = estoque;
      }
      if (luminosidade !== undefined) {
        if (!Object.values(Luminosidade).includes(luminosidade)) return res.status(400).json({ error: "Luminosidade inválida." });
        dataToUpdate.luminosidade = luminosidade;
      }
      if (petFriendly !== undefined) {
        if (typeof petFriendly !== "boolean") return res.status(400).json({ error: "Campo petFriendly inválido." });
        dataToUpdate.petFriendly = petFriendly;
      }
      if (regaACadaDias !== undefined) {
        if (!Number.isInteger(regaACadaDias) || regaACadaDias <= 0 || regaACadaDias > MAX_INT) return res.status(400).json({ error: "regaACadaDias inválido." });
        dataToUpdate.regaACadaDias = regaACadaDias;
      }

      const plantaExiste = await plantaRepository.findById(id);
      if (!plantaExiste) {
        return res.status(404).json({ error: "Planta não encontrada para atualização." });
      }

      const plantaAtualizada = await plantaRepository.update(id, dataToUpdate);
      return res.status(200).json(plantaAtualizada);
    } catch (error) {
      return res.status(500).json({ error: "Erro interno ao atualizar a planta." });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const id = parseIdParam(req.params.id);
      if (!id) {
        return res.status(400).json({ error: "ID inválido ou excede o limite permitido." });
      }

      const plantaExiste = await plantaRepository.findById(id);
      if (!plantaExiste) {
        return res.status(404).json({ error: "Planta não encontrada para exclusão." });
      }

      await plantaRepository.delete(id);
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ error: "Erro interno ao excluir a planta." });
    }
  }

  async vender(req: Request, res: Response) {
    try {
      const id = parseIdParam(req.params.id);
      if (!id) {
        return res.status(400).json({ error: "ID inválido ou excede o limite permitido." });
      }

      const body = req.body ?? {};
      const { quantidade } = body;
      if (!Number.isInteger(quantidade) || quantidade <= 0 || quantidade > MAX_INT) {
        return res.status(400).json({ error: "Quantidade inválida. Deve ser um inteiro maior que zero." });
      }

      const plantaExiste = await plantaRepository.findById(id);
      if (!plantaExiste) {
        return res.status(404).json({ error: "Planta não encontrada." });
      }

      const updatedCount = await plantaRepository.venderAtomico(id, quantidade);
      if (updatedCount === 0) {
        // Validação defensiva para concorrência: verificar se foi apagada ou se é falta de estoque
        const plantaAtual = await plantaRepository.findById(id);
        if (!plantaAtual) {
          return res.status(404).json({ error: "Planta foi removida concorrentemente durante a operação." });
        }
        return res.status(400).json({ error: "Estoque insuficiente para realizar a venda." });
      }

      const plantaAtualizada = await plantaRepository.findById(id);
      return res.status(200).json(plantaAtualizada);
    } catch (error) {
      return res.status(500).json({ error: "Erro interno ao realizar a venda." });
    }
  }

  async valorTotalEstoque(req: Request, res: Response) {
    try {
      const plantas = await plantaRepository.findAllPrecoEstoque();

      let valorTotalEmCentavos = 0;
      let totalDeVasos = 0;

      for (const planta of plantas) {
        valorTotalEmCentavos += planta.preco * planta.estoque;
        totalDeVasos += planta.estoque;
      }

      return res.status(200).json({
        valorTotalEmCentavos,
        totalDeVasos,
      });
    } catch (error) {
      return res.status(500).json({ error: "Erro interno ao calcular o valor total do estoque." });
    }
  }
}
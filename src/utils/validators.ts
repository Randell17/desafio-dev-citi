import { Luminosidade } from "@prisma/client";

export const MAX_INT = 2147483647;

export function isValidInt(value: unknown): boolean {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value > 0 &&
    value <= MAX_INT
  );
}

export function isValidEstoque(value: unknown): boolean {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= MAX_INT
  );
}

export function parseIdParam(idStr: string): number | null {
  const num = Number(idStr);
  if (!isValidInt(num)) {
    return null;
  }
  return num;
}

// Validador universal reutilizável para create e update
export function validarPlanta(body: any, isCreate: boolean = false): string[] {
  const errors: string[] = [];
  const { nome, especie, preco, estoque, luminosidade, petFriendly, regaACadaDias } = body ?? {};

  if (isCreate || nome !== undefined) {
    if (typeof nome !== "string" || nome.trim() === "") {
      errors.push("Nome inválido ou ausente.");
    }
  }

  if (isCreate || especie !== undefined) {
    if (typeof especie !== "string" || especie.trim() === "") {
      errors.push("Espécie inválida ou ausente.");
    }
  }

  if (isCreate || preco !== undefined) {
    if (!isValidInt(preco)) {
      errors.push("Preço inválido (deve ser inteiro positivo até MAX_INT).");
    }
  }

  if (isCreate || estoque !== undefined) {
    if (!isValidEstoque(estoque)) {
      errors.push("Estoque inválido (deve ser inteiro não negativo até MAX_INT).");
    }
  }

  if (isCreate || luminosidade !== undefined) {
    if (!Object.values(Luminosidade).includes(luminosidade)) {
      errors.push("Luminosidade inválida.");
    }
  }

  if (isCreate || petFriendly !== undefined) {
    if (typeof petFriendly !== "boolean") {
      errors.push("Campo petFriendly deve ser booleano.");
    }
  }

  if (isCreate || regaACadaDias !== undefined) {
    if (!isValidInt(regaACadaDias)) {
      errors.push("regaACadaDias inválido.");
    }
  }

  return errors;
}
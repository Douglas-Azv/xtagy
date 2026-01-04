import React, { useEffect } from 'react';
import { LabelData } from '../types'; // Ajuste conforme seu tipo de etiqueta

interface LabelPrintProps {
  labels: LabelData[];
  onClose?: () => void;
}

const LabelPrint: React.FC<LabelPrintProps> = ({ labels, onClose }) => {

  useEffect(() => {
    // Ativa o container de impressão
    const printRoot = document.getElementById('print-root');
    if (!printRoot) return;

    printRoot.classList.add('active');

    // Renderiza as etiquetas dentro do container
    printRoot.innerHTML = ''; // limpa conteúdo anterior
    labels.forEach((label) => {
      const div = document.createElement('div');
      div.className = 'label';
      div.innerHTML = `
        <p><strong>${label.title}</strong></p>
        <p>${label.description}</p>
        <p>${label.extraInfo || ''}</p>
      `;
      printRoot.appendChild(div);
    });

    // Delay para garantir que o DOM renderize antes do print
    setTimeout(() => {
      window.print();
      printRoot.classList.remove('active');
      printRoot.innerHTML = '';
      if (onClose) onClose();
    }, 500);

  }, [labels, onClose]);

  return null; // Não renderiza nada no DOM normal
};

export default LabelPrint;
// 各カラムの最大値をハイライトする関数
function highlightMaxValues() {
    const table = document.querySelector('.mobile-data-table');
    if (!table) return;
  
    const tbody = table.querySelector('tbody');
    if (!tbody) return;
  
    // ハイライト対象のカラムクラス名
    const targetColumns = [
      'mobile-col-wins',      // 勝利数
      'mobile-col-rate',      // レート
      'mobile-col-payback'    // 回収率
    ];
  
    // 各カラムごとに処理
    targetColumns.forEach(columnClass => {
      const cells = tbody.querySelectorAll(`td.${columnClass}`);
      if (cells.length === 0) return;
  
      let maxValue = -Infinity;
      const cellData = [];
  
      cells.forEach(cell => {
        const text = cell.textContent.trim();
        const numericValue = parseFloat(text.replace(/[^0-9.-]/g, ''));
        
        if (!isNaN(numericValue)) {
          cellData.push({ cell, value: numericValue });
          if (numericValue > maxValue) {
            maxValue = numericValue;
          }
        }
      });
  
      cellData.forEach(data => {
        if (data.value === maxValue) {
          data.cell.classList.add('mobile-col-max-value');
        }
      });
    });
  }
  
  document.addEventListener('DOMContentLoaded', highlightMaxValues);
  
  const observer = new MutationObserver(() => {
    document.querySelectorAll('.mobile-col-max-value').forEach(cell => {
      cell.classList.remove('mobile-col-max-value');
    });
    highlightMaxValues();
  });
  
  document.addEventListener('DOMContentLoaded', () => {
    const table = document.querySelector('.mobile-data-table');
    if (table) {
      observer.observe(table, {
        childList: true,
        subtree: true,
        characterData: true
      });
    }
  });
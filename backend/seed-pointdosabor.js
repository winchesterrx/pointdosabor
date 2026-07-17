import db from './db.js';

async function seedPointDoSabor() {
  console.log('🍦 Iniciando seed do banco de dados para Point do Sabor...');
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Limpar relações antigas
    console.log('Limpando dados antigos...');
    await connection.query('DELETE FROM product_addons');
    await connection.query('DELETE FROM addon_categories');
    await connection.query('DELETE FROM products');
    await connection.query('DELETE FROM addons');
    await connection.query('DELETE FROM categories');

    // 2. Inserir Categorias
    console.log('Inserindo categorias...');
    const categories = [
      ['lanches', 'Lanches & Porções', 'sandwich'],
      ['doces', 'Sorvetes & Doces', 'ice-cream'],
      ['bebidas', 'Bebidas', 'coffee']
    ];
    for (const cat of categories) {
      await connection.query('INSERT INTO categories (id, name, icon) VALUES (?, ?, ?)', cat);
    }

    // 3. Inserir Adicionais
    console.log('Inserindo adicionais...');
    const addons = [
      ['cobertura-choc', 'Cobertura de Chocolate', 2.00],
      ['cobertura-morango', 'Cobertura de Morango', 2.00],
      ['cobertura-caramelo', 'Cobertura de Caramelo', 2.00],
      ['granulado', 'Granulado', 1.50],
      ['chantilly', 'Chantilly', 2.50],
      ['leite-condensado', 'Leite Condensado', 2.00],
      ['leite-ninho', 'Leite Ninho', 3.00],
      ['granola', 'Granola', 2.50],
      ['banana', 'Banana', 2.00],
      ['morango', 'Morango Extra', 3.50],
      ['paçoca', 'Paçoca', 2.00],
      ['confete', 'Confete', 2.50],
      ['bacon', 'Bacon', 5.00],
      ['queijo-extra', 'Queijo Extra', 4.00],
      ['ovo', 'Ovo', 3.00],
      ['cheddar', 'Cheddar', 4.50],
      ['salada', 'Salada Extra', 2.00],
      ['milho', 'Milho', 2.50],
      ['catupiry', 'Catupiry', 4.00]
    ];
    for (const addon of addons) {
      await connection.query('INSERT INTO addons (id, name, price) VALUES (?, ?, ?)', addon);
    }

    // 4. Inserir relações Addon <-> Categoria
    console.log('Inserindo relações adicionais-categorias...');
    const addonCategories = [
      ['cobertura-choc', 'doces'],
      ['cobertura-morango', 'doces'],
      ['cobertura-caramelo', 'doces'],
      ['granulado', 'doces'],
      ['chantilly', 'doces'], ['chantilly', 'bebidas'],
      ['leite-condensado', 'doces'],
      ['leite-ninho', 'doces'],
      ['granola', 'doces'],
      ['banana', 'doces'],
      ['morango', 'doces'],
      ['paçoca', 'doces'],
      ['confete', 'doces'],
      ['bacon', 'lanches'],
      ['queijo-extra', 'lanches'],
      ['ovo', 'lanches'],
      ['cheddar', 'lanches'],
      ['salada', 'lanches'],
      ['milho', 'lanches'],
      ['catupiry', 'lanches']
    ];
    for (const rel of addonCategories) {
      await connection.query('INSERT INTO addon_categories (addon_id, category_id) VALUES (?, ?)', rel);
    }

    // 5. Inserir Produtos
    console.log('Inserindo produtos...');
    const products = [
      // Lanches & Porções - Hambúrgueres
      ['12', 'X-Burguer', 'Pão artesanal, hambúrguer bovino 150g, queijo, alface e tomate', 22.00, null, 'lanches', 'Hambúrgueres', 0, 410, 0],
      ['13', 'X-Bacon', 'Pão artesanal, hambúrguer bovino 150g, bacon crocante, queijo e molho especial', 28.00, null, 'lanches', 'Hambúrgueres', 1, 380, 0],
      ['14', 'X-Tudo', 'Pão artesanal, hambúrguer duplo, bacon, ovo, cheddar, alface, tomate e milho', 35.00, null, 'lanches', 'Hambúrgueres', 0, 290, 0],
      // Lanches & Porções - Frango
      ['15', 'X-Frango', 'Pão artesanal, filé de frango grelhado, queijo, alface e maionese da casa', 25.00, null, 'lanches', 'Frango', 0, 220, 0],
      // Lanches & Porções - Hot Dogs
      ['16', 'Hot Dog Tradicional', 'Pão de hot dog, duas salsichas, vinagrete, batata palha e molhos', 15.00, null, 'lanches', 'Hot Dogs', 0, 350, 0],
      ['17', 'Hot Dog Especial', 'Pão de hot dog, duas salsichas, cheddar, bacon, milho, ervilha e batata palha', 22.00, null, 'lanches', 'Hot Dogs', 1, 280, 0],
      // Lanches & Porções - Porções
      ['18', 'Batata Frita', 'Porção generosa de batata frita crocante com sal e temperos', 18.00, null, 'lanches', 'Porções', 0, 390, 0],
      ['19', 'Batata com Cheddar e Bacon', 'Batata frita coberta com cheddar cremoso e bacon crocante', 28.00, null, 'lanches', 'Porções', 1, 310, 0],
      ['20', 'Porção de Frango', 'Pedaços de frango empanado crocante com molho especial', 25.00, null, 'lanches', 'Porções', 0, 180, 0],
      ['21', 'Onion Rings', 'Anéis de cebola empanados super crocantes', 20.00, null, 'lanches', 'Porções', 0, 150, 0],
      // Sorvetes & Doces - Sorvetes
      ['1', 'Sorvete 1 Bola', 'Uma bola de sorvete artesanal no sabor à sua escolha servida na casquinha ou copinho', 8.00, null, 'doces', 'Sorvetes', 0, 520, 1],
      ['2', 'Sorvete 2 Bolas', 'Duas bolas de sorvete artesanal nos sabores à sua escolha', 14.00, null, 'doces', 'Sorvetes', 0, 430, 1],
      ['3', 'Sorvete 3 Bolas', 'Três bolas de sorvete artesanal nos sabores à sua escolha com cobertura grátis', 18.00, null, 'doces', 'Sorvetes', 1, 380, 1],
      ['4', 'Sundae de Chocolate', 'Sorvete de creme com calda quente de chocolate belga, chantilly e granulado', 22.00, null, 'doces', 'Sorvetes', 1, 290, 1],
      ['5', 'Sundae de Morango', 'Sorvete de morango com calda de frutas vermelhas, chantilly e morango fresco', 22.00, null, 'doces', 'Sorvetes', 0, 245, 1],
      // Sorvetes & Doces - Milk-Shakes
      ['6', 'Milk-Shake Chocolate', 'Cremoso milk-shake de chocolate com sorvete artesanal e chantilly', 18.00, null, 'doces', 'Milk-Shakes', 0, 310, 1],
      ['7', 'Milk-Shake Morango', 'Milk-shake de morango natural com sorvete e chantilly', 18.00, null, 'doces', 'Milk-Shakes', 0, 280, 1],
      // Sorvetes & Doces - Açaí & Bowls
      ['8', 'Açaí 300ml', 'Açaí puro batido na hora, escolha seus acompanhamentos favoritos', 15.00, null, 'doces', 'Açaí & Bowls', 0, 620, 1],
      ['9', 'Açaí 500ml', 'Açaí puro batido na hora com acompanhamentos à sua escolha', 22.00, null, 'doces', 'Açaí & Bowls', 1, 510, 1],
      ['10', 'Açaí 700ml', 'Porção generosa de açaí puro com acompanhamentos inclusos', 28.00, null, 'doces', 'Açaí & Bowls', 0, 340, 1],
      ['11', 'Bowl de Açaí Premium', 'Açaí na tigela com granola, banana, morango, leite ninho e mel', 32.00, null, 'doces', 'Açaí & Bowls', 1, 195, 1],
      // Sorvetes & Doces - Sobremesas
      ['27', 'Banana Split', 'Banana com 3 bolas de sorvete, caldas de chocolate e morango, chantilly e cereja', 28.00, null, 'doces', 'Sobremesas', 1, 175, 1],
      ['28', 'Brownie com Sorvete', 'Brownie quentinho de chocolate com bola de sorvete de creme e calda', 24.00, null, 'doces', 'Sobremesas', 0, 210, 0],
      ['29', 'Petit Gateau', 'Bolinho de chocolate com interior cremoso, servido com sorvete de creme', 26.00, null, 'doces', 'Sobremesas', 0, 165, 0],
      // Bebidas
      ['22', 'Coca-Cola 350ml', 'Refrigerante gelado', 7.00, null, 'bebidas', 'Refrigerantes', 0, 680, 0],
      ['23', 'Guaraná Antarctica 350ml', 'Refrigerante gelado', 6.50, null, 'bebidas', 'Refrigerantes', 0, 420, 0],
      ['24', 'Suco Natural 500ml', 'Suco natural da fruta, escolha: laranja, maracujá ou limão', 12.00, null, 'bebidas', 'Sucos', 0, 260, 1],
      ['25', 'Água Mineral 500ml', 'Água mineral gelada', 4.00, null, 'bebidas', 'Sucos', 0, 530, 0],
      ['26', 'Água com Gás 500ml', 'Água mineral com gás gelada', 5.00, null, 'bebidas', 'Sucos', 0, 180, 0]
    ];
    for (const prod of products) {
      await connection.query(
        'INSERT INTO products (id, name, description, price, image, category_id, sub_category, is_promo, order_count, is_made_to_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        prod
      );
    }

    // 6. Inserir relações Produto <-> Addon
    console.log('Inserindo relações produtos-adicionais...');
    const productAddons = [
      // Sorvetes
      ['1', 'cobertura-choc'], ['1', 'cobertura-morango'], ['1', 'cobertura-caramelo'], ['1', 'granulado'], ['1', 'chantilly'], ['1', 'confete'], ['1', 'paçoca'],
      ['2', 'cobertura-choc'], ['2', 'cobertura-morango'], ['2', 'cobertura-caramelo'], ['2', 'granulado'], ['2', 'chantilly'], ['2', 'confete'], ['2', 'paçoca'],
      ['3', 'cobertura-choc'], ['3', 'cobertura-morango'], ['3', 'cobertura-caramelo'], ['3', 'granulado'], ['3', 'chantilly'], ['3', 'leite-ninho'], ['3', 'confete'],
      ['4', 'cobertura-choc'], ['4', 'chantilly'], ['4', 'granulado'], ['4', 'leite-condensado'],
      ['5', 'cobertura-morango'], ['5', 'chantilly'], ['5', 'granulado'], ['5', 'morango'],
      ['6', 'chantilly'], ['6', 'cobertura-choc'], ['6', 'leite-ninho'],
      ['7', 'chantilly'], ['7', 'cobertura-morango'], ['7', 'morango'],
      // Açaí
      ['8', 'granola'], ['8', 'banana'], ['8', 'morango'], ['8', 'leite-ninho'], ['8', 'leite-condensado'], ['8', 'paçoca'], ['8', 'confete'],
      ['9', 'granola'], ['9', 'banana'], ['9', 'morango'], ['9', 'leite-ninho'], ['9', 'leite-condensado'], ['9', 'paçoca'], ['9', 'confete'],
      ['10', 'granola'], ['10', 'banana'], ['10', 'morango'], ['10', 'leite-ninho'], ['10', 'leite-condensado'], ['10', 'paçoca'], ['10', 'confete'],
      ['11', 'granola'], ['11', 'banana'], ['11', 'morango'], ['11', 'leite-ninho'], ['11', 'leite-condensado'], ['11', 'paçoca'],
      // Lanches
      ['12', 'bacon'], ['12', 'queijo-extra'], ['12', 'ovo'], ['12', 'cheddar'], ['12', 'salada'], ['12', 'catupiry'],
      ['13', 'bacon'], ['13', 'queijo-extra'], ['13', 'ovo'], ['13', 'cheddar'], ['13', 'salada'], ['13', 'catupiry'],
      ['14', 'bacon'], ['14', 'queijo-extra'], ['14', 'cheddar'], ['14', 'catupiry'],
      ['15', 'bacon'], ['15', 'queijo-extra'], ['15', 'ovo'], ['15', 'cheddar'], ['15', 'salada'], ['15', 'catupiry'],
      ['16', 'bacon'], ['16', 'queijo-extra'], ['16', 'cheddar'], ['16', 'milho'],
      ['17', 'bacon'], ['17', 'queijo-extra'], ['17', 'cheddar'], ['17', 'catupiry'],
      // Porções
      ['18', 'bacon'], ['18', 'cheddar'], ['18', 'catupiry'],
      ['19', 'bacon'], ['19', 'catupiry'],
      ['20', 'cheddar'], ['20', 'catupiry'],
      ['21', 'cheddar'],
      // Sobremesas
      ['27', 'cobertura-choc'], ['27', 'cobertura-morango'], ['27', 'chantilly'], ['27', 'granulado'], ['27', 'leite-condensado'],
      ['28', 'cobertura-choc'], ['28', 'chantilly'], ['28', 'leite-condensado'],
      ['29', 'cobertura-choc'], ['29', 'chantilly']
    ];
    for (const rel of productAddons) {
      await connection.query('INSERT INTO product_addons (product_id, addon_id) VALUES (?, ?)', rel);
    }

    await connection.commit();
    console.log('✅ Seed do Point do Sabor concluído com sucesso!');
    process.exit(0);
  } catch (error) {
    await connection.rollback();
    console.error('❌ Erro durante o seed:', error);
    process.exit(1);
  } finally {
    connection.release();
  }
}

seedPointDoSabor();

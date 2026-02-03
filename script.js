// 权重对象
var Weight;

// 获取一个人的加权分数
const getScore = d => {
    const totalWeight = Object.values(Weight).reduce((sum, val) => sum + val, 0);
    let weightedSum = 0;
    for (let key in Weight) {
        weightedSum += d[key] * Weight[key];
    }
    return weightedSum / totalWeight;
};

const svg = d3.select('#graph');
const xAttr = '名称';
const xRange = d => d.名称;
const yRange = d => getScore(d);

var width, height, margin, innerWidth, innerHeight;
var xScale, yScale, colorScale, xAxis, yAxis;

// 计算SVG尺寸
const calculateDimensions = () => {
    const container = document.getElementById('graph');
    const rect = container.getBoundingClientRect();
    
    // 响应式宽度
    width = rect.width || container.clientWidth || window.innerWidth - 30;
    
    // 根据屏幕宽度调整高度比例
    if (window.innerWidth < 600) {
        height = Math.min(width * 0.8, 400);
        margin = { top: 15, right: 15, bottom: 25, left: 35 };
    } else if (window.innerWidth < 900) {
        height = Math.min(width * 0.6, 450);
        margin = { top: 20, right: 20, bottom: 25, left: 35 };
    } else {
        height = Math.min(width * 0.65, 550);
        margin = { top: 20, right: 30, bottom: 20, left: 30 };
    }
    
    innerWidth = width - margin.left - margin.right;
    innerHeight = height - margin.top - margin.bottom;
    
    svg.attr('width', width)
       .attr('height', height)
       .attr('viewBox', `0 0 ${width} ${height}`);
};

const initialize = data => {
    calculateDimensions();
    
    xScale = d3.scaleBand()
               .domain(data.map(xRange))
               .range([margin.left, innerWidth + margin.left])
               .padding(0.1);
                    
    yScale = d3.scaleLinear()
               .domain([0, 10])
               .range([innerHeight, margin.top]);

    colorScale = d3.scaleOrdinal()
                   .domain(data.map(xRange))
                   .range(d3.schemeCategory10);

    xAxis = d3.axisBottom(xScale);
    yAxis = d3.axisLeft(yScale)
              .tickSize(-innerWidth);

    svg.append('g')
       .attr('class', 'y-axis')
       .attr('transform', `translate(${margin.left}, 0)`)
       .call(yAxis);
};

const updateScales = data => {
    calculateDimensions();
    
    xScale.domain(data.map(xRange))
          .range([margin.left, innerWidth + margin.left]);
    
    yScale.range([innerHeight, margin.top]);
    
    yAxis.tickSize(-innerWidth);
    
    svg.select('.y-axis')
       .attr('transform', `translate(${margin.left}, 0)`)
       .call(yAxis);
};

const render = data => {
    // 根据屏幕宽度调整字体大小
    const nameFontSize = window.innerWidth < 600 ? '10px' : '13px';
    const valueFontSize = window.innerWidth < 600 ? '10px' : '13px';
    
    const bar = svg.selectAll('rect').data(data, xRange);
    bar.enter().append('rect')
        .attr('width', xScale.bandwidth())
        .attr('fill', d => colorScale(d[xAttr]))
        .attr('x', d => xScale(d[xAttr]))
        .attr('y', d => yScale(getScore(d)))
        .attr('height', d => innerHeight - yScale(getScore(d)))
        .merge(bar)
        .transition().duration(1000)
        .attr('width', xScale.bandwidth())
        .attr('x', d => xScale(d[xAttr]))
        .attr('y', d => yScale(getScore(d)))
        .attr('height', d => innerHeight - yScale(getScore(d)));
    bar.exit().remove();

    const name_label = svg.selectAll('.name_label').data(data, xRange);
    name_label.enter().append('text')
        .attr('x', d => xScale(d[xAttr]) + xScale.bandwidth() / 2)
        .attr('y', innerHeight + margin.top)
        .attr('text-anchor', 'middle')
        .attr('class', 'name_label')
        .style('font-size', nameFontSize)
        .merge(name_label)
        .transition().duration(1000)
        .text(xRange)
        .style('font-size', nameFontSize)
        .attr('x', d => xScale(d[xAttr]) + xScale.bandwidth() / 2)
        .attr('y', innerHeight + margin.top);
    name_label.exit().remove();
    
    const value_label = svg.selectAll('.value_label').data(data, xRange);
    value_label.enter().append('text')
        .attr('x', d => xScale(d[xAttr]) + xScale.bandwidth() / 2)
        .attr('y', d => yScale(getScore(d)) + 15)
        .attr('text-anchor', 'middle')
        .attr('class', 'value_label')
        .style('font-size', valueFontSize)
        .attr('fill', 'white')
        .merge(value_label)      
        .transition().duration(1000)
        .text(d => getScore(d).toFixed(2))
        .style('font-size', valueFontSize)
        .attr('x', d => xScale(d[xAttr]) + xScale.bandwidth() / 2)
        .attr('y', d => yScale(getScore(d)) + 15);
    value_label.exit().remove();
};

// 全局数据变量，用于resize时重新渲染
var globalData;

d3.csv('restaurant.csv').then(data => {
    // 把所有数据从字符串转成数字
    data.forEach(d => {
        d.廉价 = +d.廉价;
        d.口感 = +d.口感;
        d.卫生 = +d.卫生;
        d.健康 = +d.健康;
        d.店铺数 = +d.店铺数;
        d.预制菜维度分 = +d.预制菜维度分;
    });
    
    // 初始化权重
    Weight = {
        '廉价': 0.5, 
        '口感': 0.5, 
        '卫生': 0.5, 
        '健康': 0.5, 
        '店铺数': 0.5,
        '预制菜维度分': 0.5
    };
    
    // 排序 
    data = data.sort((a, b) => getScore(a) - getScore(b));
    globalData = data;
    
    var controller = d3.select('#controller');
    
    // 构造控制器
    Object.keys(data[0]).forEach(d => {
        if (d != '名称') { 
            var div = controller.append('div')
                                .attr('class', 'roll');
            div.append('p').text(d);
            div.append('input')
                .attr('id', d)
                .attr('type', 'range')
                .attr('min', '0')
                .attr('max', '1')
                .attr('step', '0.25')
                .attr('value', '0.5');
            div.append('p')
                .text('0.5')
                .attr('class', 'weight');
        }
    });

    // 初始化渲染
    initialize(data);
    render(data);

    // 监听滑动条改变事件
    d3.selectAll("input[type='range']")
        .on('input', function() {
            const attr = d3.select(this).attr('id');
            Weight[attr] = +this.value;
            data = data.sort((a, b) => getScore(a) - getScore(b));
            globalData = data;
            xScale.domain(data.map(d => d[xAttr]));
            d3.select(this.parentNode)
              .select('.weight')
              .text(this.value);
            render(data);
        });
    
    // 监听窗口大小变化
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            updateScales(globalData);
            render(globalData);
        }, 150);
    });
});

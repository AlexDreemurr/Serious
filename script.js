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

// 计算SVG尺寸 - 使用窗口宽度作为基准
const calculateDimensions = () => {
    const containerWidth = document.getElementById('container').clientWidth || window.innerWidth - 20;
    
    // 根据屏幕宽度决定布局
    if (window.innerWidth < 900) {
        // 手机端：图表占满容器宽度
        width = containerWidth - 12;
        height = Math.max(300, Math.min(width * 0.7, 450));
        margin = { top: 20, right: 15, bottom: 70, left: 30 };
    } else {
        // 桌面端：图表占75%宽度
        width = (containerWidth - 12) * 0.75 - 10;
        height = Math.max(400, Math.min(width * 0.6, 550));
        margin = { top: 20, right: 30, bottom: 25, left: 40 };
    }
    
    innerWidth = width - margin.left - margin.right;
    innerHeight = height - margin.top - margin.bottom;
    
    // 确保innerHeight为正值
    if (innerHeight < 50) {
        innerHeight = 300;
        height = innerHeight + margin.top + margin.bottom;
    }
    
    svg.attr('width', width)
       .attr('height', height);
};

const initialize = data => {
    calculateDimensions();
    
    xScale = d3.scaleBand()
               .domain(data.map(xRange))
               .range([margin.left, innerWidth + margin.left])
               .padding(0.1);
                    
    yScale = d3.scaleLinear()
               .domain([0, 10])
               .range([innerHeight + margin.top, margin.top]);

    colorScale = d3.scaleOrdinal()
                   .domain(data.map(xRange))
                   .range(d3.schemeCategory10);

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
    
    yScale.range([innerHeight + margin.top, margin.top]);
    
    yAxis.tickSize(-innerWidth);
    
    svg.select('.y-axis')
       .attr('transform', `translate(${margin.left}, 0)`)
       .call(yAxis);
};

const render = data => {
    const nameFontSize = window.innerWidth < 600 ? '10px' : '13px';
    const valueFontSize = window.innerWidth < 600 ? '10px' : '13px';
    
    const bar = svg.selectAll('rect').data(data, xRange);
    bar.enter().append('rect')
        .attr('fill', d => colorScale(d[xAttr]))
        .attr('x', d => xScale(d[xAttr]))
        .attr('width', xScale.bandwidth())
        .attr('y', d => yScale(getScore(d)))
        .attr('height', d => Math.max(0, innerHeight + margin.top - yScale(getScore(d))))
        .merge(bar)
        .transition().duration(1000)
        .attr('width', xScale.bandwidth())
        .attr('x', d => xScale(d[xAttr]))
        .attr('y', d => yScale(getScore(d)))
        .attr('height', d => Math.max(0, innerHeight + margin.top - yScale(getScore(d))));
    bar.exit().remove();

    const name_label = svg.selectAll('.name_label').data(data, xRange);
    name_label.enter().append('text')
        .attr('x', d => xScale(d[xAttr]) + xScale.bandwidth() / 2)
        .attr('y', innerHeight + margin.top + 18)
        .attr('text-anchor', 'middle')
        .attr('class', 'name_label')
        .style('font-size', nameFontSize)
        .merge(name_label)
        .transition().duration(1000)
        .text(xRange)
        .style('font-size', nameFontSize)
        .attr('x', d => xScale(d[xAttr]) + xScale.bandwidth() / 2)
        .attr('y', innerHeight + margin.top + 18);
    name_label.exit().remove();
    
    const value_label = svg.selectAll('.value_label').data(data, xRange);
    value_label.enter().append('text')
        .attr('x', d => xScale(d[xAttr]) + xScale.bandwidth() / 2)
        .attr('y', d => yScale(getScore(d)) + 18)
        .attr('text-anchor', 'middle')
        .attr('class', 'value_label')
        .style('font-size', valueFontSize)
        .attr('fill', 'white')
        .merge(value_label)      
        .transition().duration(1000)
        .text(d => getScore(d).toFixed(2))
        .style('font-size', valueFontSize)
        .attr('x', d => xScale(d[xAttr]) + xScale.bandwidth() / 2)
        .attr('y', d => yScale(getScore(d)) + 18);
    value_label.exit().remove();
};

var globalData;

d3.csv('./restaurant.csv').then(data => {
    data.forEach(d => {
        d.廉价 = +d.廉价;
        d.口感 = +d.口感;
        d.卫生 = +d.卫生;
        d.健康 = +d.健康;
        d.店铺数 = +d.店铺数;
        d.预制菜维度分 = +d.预制菜维度分;
    });
    
    Weight = {
        '廉价': 0.5, 
        '口感': 0.5, 
        '卫生': 0.5, 
        '健康': 0.5, 
        '店铺数': 0.5,
        '预制菜维度分': 0.5
    };
    
    data = data.sort((a, b) => getScore(a) - getScore(b));
    globalData = data;
    
    var controller = d3.select('#controller');
    
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

    initialize(data);
    render(data);

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
    
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            updateScales(globalData);
            render(globalData);
        }, 150);
    });
});

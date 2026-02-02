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
const width = +svg.attr('width');
const height = +svg.attr('height');
const margin = { top: 20, right: 30, bottom: 20, left: 30 };
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;
const xRange = d => d.姓名;
const yRange = d => getScore(d);
var xScale;
var yScale;
var colorScale;
var xAxis;
var yAxis;

const initialize = data => {
    xScale = d3.scaleBand()
                     .domain(data.map(d => d.姓名))
                     .range([margin.left, innerWidth + margin.left])
                     .padding(0.1);
                    
    yScale = d3.scaleLinear()
                     .domain([0, 10])
                     .range([innerHeight, margin.top]);

    colorScale = d3.scaleOrdinal()
                   .domain(data.map(d => d.姓名))
                   .range(d3.schemeTableau10);

    xAxis = d3.axisBottom(xScale);
    yAxis = d3.axisLeft(yScale)
              .tickSize(-innerWidth);

    
    /*
    svg.append('g')
        .attr('transform', `translate(0, ${innerHeight})`)
        .call(xAxis);
    */
    svg.append('g')
        .attr('transform', `translate(${margin.left}, 0)`)
        .call(yAxis);
};
const render = data => {
    const bar = svg.selectAll('rect').data(data, d => d.姓名);
    bar.enter().append('rect')
                .attr('width', xScale.bandwidth())
                .attr('fill', d => colorScale(d.姓名))
                .attr('x', d => xScale(d.姓名))
                .attr('y', d => yScale(getScore(d)))
                .attr('height', d => innerHeight - yScale(getScore(d)))
                .merge(bar)
                .transition().duration(1000)
                .attr('x', d => xScale(d.姓名))
                .attr('y', d => yScale(getScore(d)))
                .attr('height', d => innerHeight - yScale(getScore(d)))
    bar.exit().remove();

    const name_label = svg.selectAll('.name_label').data(data, d => d.姓名);
    name_label.enter().append('text')
                .attr('x', d => xScale(d.姓名) + xScale.bandwidth() / 2)
                .attr('y', innerHeight + margin.top)
                .attr('text-anchor', 'middle')
                .attr('class', 'name_label')
                .style('font-size', '13px')
                .merge(name_label)
                .transition().duration(1000)
                .text(d => d.姓名)
                .attr('x', d => xScale(d.姓名) + xScale.bandwidth() / 2)
    name_label.exit().remove();
    
    const value_label = svg.selectAll('.value_label').data(data, d => d.姓名);
    value_label.enter().append('text')
                .attr('x', d => xScale(d.姓名) + xScale.bandwidth() / 2)
                .attr('y', d => yScale(getScore(d)) + 20)
                .attr('text-anchor', 'middle')
                .attr('class', 'value_label')
                .style('font-size', '13px')
                .attr('fill', 'white')
                .merge(value_label)      
                .transition().duration(1000)
                .text(d => getScore(d).toFixed(2))
                .attr('x', d => xScale(d.姓名) + xScale.bandwidth() / 2)
                .attr('y', d => yScale(getScore(d)) + 20)
    value_label.exit().remove();
};

d3.csv('data.csv').then(data => {
    data.forEach(d => {
        d.体能 = +d.体能;
        d.艺术 = +d.艺术;
        d.语言 = +d.语言;
        d.财产状况 = +d.财产状况;
        d.逻辑与数理 = +d.逻辑与数理;
    });
    Weight = {
        '体能': 0.5, 
        '逻辑与数理': 0.5, 
        '财产状况': 0.5, 
        '艺术': 0.5, 
        '语言': 0.5
    };
    initialize(data);
    render(data);
    var controller = d3.select('#controller');

    /*
        <div class='roll'>
            <p></p>
            <input id='语言'/>
            <p class='weight'></p>
        </div>
    
    */
    Object.keys(data[0]).forEach(d => {
        if (d != '姓名' && d != '性别') { 
            var div =  controller.append('div')
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
    })



    // 监听滑动条改变事件
    d3.selectAll("input[type='range']")
        .on('input', function() {
            // 修改了权重的属性名
            const attr = d3.select(this).attr('id');
            // 去Weight对象里修改对应权重值
            Weight[attr] = +this.value;
            // 排序 
            data = data.sort((a, b) => getScore(a) - getScore(b))
            // 更改x轴离散的定义域列表
            xScale.domain(data.map(d => d.姓名));
            // 显示修改后的权重值
            d3.select(this.parentNode)
              .select('.weight')
              .text(this.value);
            // 渲染新的条形图
            render(data);
        });
    
});